import UIKit
import WebKit
import UserNotifications

/// Charge l'application web (dossier « www ») dans un WKWebView et fournit le pont natif « window.Android »
/// (open, deviceId, notify, ttsSettings, stopSpeak) + un fetch natif (pas de blocage CORS sur iOS).
final class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate,
                            WKScriptMessageHandlerWithReply, UNUserNotificationCenterDelegate {

    private var web: WKWebView!
    private let green = UIColor(red: 0, green: 0x7A / 255.0, blue: 0x3A / 255.0, alpha: 1)

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    private var deviceId: String {
        let raw = UIDevice.current.identifierForVendor?.uuidString.replacingOccurrences(of: "-", with: "") ?? "IOS00000"
        return String(raw.prefix(8)).uppercased()
    }

    // Script injecté AVANT le chargement de la page : crée window.Android et remplace fetch pour les URL http(s).
    private var bridgeScript: String {
        return """
        window.__DID = "\(deviceId)";
        (function(){
          var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.native;
          if (!h) return;
          var post = function(o){ return h.postMessage(o); };
          window.Android = {
            open: function(u){ post({cmd:"open", url:String(u)}); },
            deviceId: function(){ return window.__DID || ""; },
            notify: function(t, x){ post({cmd:"notify", title:String(t), text:String(x)}); },
            ttsSettings: function(){ post({cmd:"settings"}); },
            stopSpeak: function(){ try { speechSynthesis.cancel(); } catch(e){} }
          };
          var nativeFetch = window.fetch.bind(window);
          window.fetch = function(u, o){
            var url = (u && u.url) || String(u); o = o || {};
            if (!/^https?:/i.test(url)) return nativeFetch(u, o);
            var headers = {};
            if (o.headers) { try { new Headers(o.headers).forEach(function(v,k){ headers[k]=v; }); } catch(e){} }
            return post({cmd:"fetch", url:url, method:(o.method||"GET"), headers:headers,
                         body:(typeof o.body === "string" ? o.body : null)})
              .then(function(r){ return new Response(r.body, {status:r.status, headers:r.headers}); })
              .catch(function(){ throw new TypeError("Network request failed"); });
          };
        })();
        """
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(LocalSchemeHandler(), forURLScheme: "app")
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let ucc = WKUserContentController()
        ucc.addUserScript(WKUserScript(source: bridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        ucc.addScriptMessageHandler(self, contentWorld: .page, name: "native")
        config.userContentController = ucc

        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.isOpaque = false
        web.backgroundColor = .white
        web.scrollView.backgroundColor = .white
        web.scrollView.bounces = false
        web.translatesAutoresizingMaskIntoConstraints = false

        // bande verte sous l'encoche / barre d'état
        let top = UIView()
        top.backgroundColor = green
        top.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(top)
        view.addSubview(web)
        let g = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            top.topAnchor.constraint(equalTo: view.topAnchor),
            top.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            top.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            top.bottomAnchor.constraint(equalTo: g.topAnchor),
            web.topAnchor.constraint(equalTo: g.topAnchor),
            web.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: g.trailingAnchor),
            web.bottomAnchor.constraint(equalTo: g.bottomAnchor)
        ])

        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }

        web.load(URLRequest(url: URL(string: "app://localhost/index.html")!))
    }

    // MARK: - Pont natif (appels JS -> Swift avec réponse)
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], let cmd = body["cmd"] as? String else {
            replyHandler(nil, "bad message"); return
        }
        switch cmd {
        case "open":
            if let s = body["url"] as? String, let u = URL(string: s) { UIApplication.shared.open(u) }
            replyHandler(nil, nil)
        case "settings":
            if let u = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(u) }
            replyHandler(nil, nil)
        case "notify":
            let c = UNMutableNotificationContent()
            c.title = body["title"] as? String ?? ""
            c.body = body["text"] as? String ?? ""
            c.sound = .default
            let req = UNNotificationRequest(identifier: UUID().uuidString, content: c, trigger: nil)
            UNUserNotificationCenter.current().add(req)
            replyHandler(nil, nil)
        case "fetch":
            nativeFetch(body, replyHandler)
        default:
            replyHandler(nil, "unknown command")
        }
    }

    private func nativeFetch(_ body: [String: Any], _ reply: @escaping (Any?, String?) -> Void) {
        guard let s = body["url"] as? String, let url = URL(string: s), url.scheme?.hasPrefix("http") == true else {
            reply(nil, "bad url"); return
        }
        var req = URLRequest(url: url)
        req.httpMethod = (body["method"] as? String ?? "GET").uppercased()
        req.timeoutInterval = 25
        if let h = body["headers"] as? [String: String] { for (k, v) in h { req.setValue(v, forHTTPHeaderField: k) } }
        if let b = body["body"] as? String { req.httpBody = b.data(using: .utf8) }
        URLSession.shared.dataTask(with: req) { data, resp, err in
            DispatchQueue.main.async {
                guard err == nil, let http = resp as? HTTPURLResponse else { reply(nil, "network"); return }
                var headers: [String: String] = [:]
                if let ct = http.value(forHTTPHeaderField: "Content-Type") { headers["Content-Type"] = ct }
                let text = String(data: data ?? Data(), encoding: .utf8) ?? ""
                reply(["status": http.statusCode, "headers": headers, "body": text], nil)
            }
        }.resume()
    }

    // MARK: - Liens externes (WhatsApp, e-mail, téléphone, sites web)
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let u = navigationAction.request.url, u.scheme != "app", u.scheme != "about" {
            UIApplication.shared.open(u)
            decisionHandler(.cancel)
        } else {
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let u = navigationAction.request.url { UIApplication.shared.open(u) }
        return nil
    }

    // Affiche les notifications même quand l'application est ouverte
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}

/// Sert les fichiers du dossier « www » sous l'adresse app://localhost/ (origine stable pour localStorage).
final class LocalSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url, let root = Bundle.main.resourceURL?.appendingPathComponent("www") else {
            task.didFailWithError(URLError(.badURL)); return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst()))
        guard file.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: file) else {
            let r = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!
            task.didReceive(r); task.didFinish(); return
        }
        let mime: String
        switch file.pathExtension.lowercased() {
        case "html": mime = "text/html; charset=utf-8"
        case "js": mime = "application/javascript; charset=utf-8"
        case "css": mime = "text/css; charset=utf-8"
        case "json": mime = "application/json; charset=utf-8"
        case "png": mime = "image/png"
        case "jpg", "jpeg": mime = "image/jpeg"
        case "svg": mime = "image/svg+xml"
        case "mp3": mime = "audio/mpeg"
        default: mime = "application/octet-stream"
        }
        let r = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                headerFields: ["Content-Type": mime, "Content-Length": String(data.count)])!
        task.didReceive(r)
        task.didReceive(data)
        task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}
