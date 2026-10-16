/* Cours & fiches (v4) : français (vocabulaire, grammaire, conjugaison), mathématiques, histoire, géographie */
(function(){
const F=[
/* ================= FRANÇAIS — VOCABULAIRE ================= */
{id:"c_fr_v1",m:"fr",t:"Vocabulaire 1 : synonymes, antonymes, homonymes, paronymes",h:`
<p><b>Synonymes</b> : mots de sens proche (<i>courageux / brave</i>, <i>commencer / débuter</i>). Un synonyme n'est jamais parfait : tiens compte du contexte et du registre.</p>
<p><b>Antonymes (contraires)</b> : mots de sens opposé (<i>riche / pauvre</i>, <i>accepter / refuser</i>). On les forme aussi avec des préfixes : <i>possible → impossible</i>, <i>honnête → malhonnête</i>.</p>
<p><b>Homonymes</b> : mots qui se prononcent pareil mais n'ont pas le même sens. <i>vers / verre / vert / ver</i> ; <i>cent / sang / sans</i> ; <i>mère / maire / mer</i>.</p>
<p><b>Paronymes</b> : mots qui se ressemblent sans être identiques. <i>éminent / imminent</i>, <i>effraction / infraction</i>, <i>conjecture / conjoncture</i>, <i>émigrer / immigrer</i>, <i>acception / acceptation</i>.</p>
<p><b>Polysémie</b> : un mot a plusieurs sens (<i>un pied de table, le pied d'un homme</i>). <b>Sens propre</b> = sens littéral ; <b>sens figuré</b> = image (<i>un cœur de pierre</i>).</p>
<ul><li><b>Dénotation</b> : sens objectif du mot ; <b>connotation</b> : sens secondaire, subjectif.</li><li>Pour trouver un contraire, cherche d'abord le sens exact du mot dans la phrase.</li></ul>`},
{id:"c_fr_v2",m:"fr",t:"Vocabulaire 2 : formation des mots (préfixes, suffixes, familles)",h:`
<p>Un mot se décompose : <b>préfixe</b> + <b>radical</b> + <b>suffixe</b>. Ex. : <i>in-</i> + <i>cré</i> + <i>-dible</i>.</p>
<p><b>Préfixes courants</b> :</p>
<ul>
<li><b>in-, im-, il-, ir-, dés-, mal-, a-</b> : contraire (<i>injuste, impossible, illégal, irréel, désobéir, malheureux, anormal</i>)</li>
<li><b>re-, ré-</b> : répétition (<i>refaire, réécrire</i>)</li>
<li><b>anti-, contre-</b> : opposition (<i>antivol, contredire</i>)</li>
<li><b>pré-, anté-</b> : avant (<i>prévoir, antérieur</i>) ; <b>post-</b> : après (<i>postscolaire</i>)</li>
<li><b>sur-, hyper-</b> : au-dessus, excès (<i>surpopulation, hypermarché</i>) ; <b>sous-, hypo-</b> : en dessous</li>
<li><b>co-, con-, syn-</b> : avec (<i>coopérer, concitoyen</i>) ; <b>inter-</b> : entre ; <b>trans-</b> : à travers</li>
<li><b>bi-, tri-, multi-, poly-, mono-</b> : nombre (<i>bilingue, multicolore, monopole</i>)</li>
</ul>
<p><b>Suffixes courants</b> : <b>-able / -ible</b> (possibilité : <i>mangeable</i>), <b>-eur / -teur</b> (celui qui : <i>chanteur</i>), <b>-tion / -ment / -age</b> (noms d'action), <b>-ité / -esse / -eur</b> (qualité : <i>honnêteté, tristesse</i>), <b>-ier / -iste</b> (métier), <b>-ment</b> (adverbes de manière).</p>
<p><b>Famille de mots</b> : mots de même racine (<i>terre, terrain, terrestre, enterrer, atterrir</i>). <b>Champ lexical</b> : ensemble de mots d'un même thème (école : <i>classe, élève, cahier, maître</i>). <b>Champ sémantique</b> : l'ensemble des sens d'un mot.</p>`},
{id:"c_fr_v3",m:"fr",t:"Vocabulaire 3 : registres de langue et figures de style",h:`
<p><b>Registres</b> : <b>familier</b> (<i>bagnole, boulot</i>), <b>courant</b> (<i>voiture, travail</i>), <b>soutenu</b> (<i>automobile, labeur</i>).</p>
<p><b>Figures de style</b> :</p>
<ul>
<li><b>Comparaison</b> : outil de comparaison (<i>comme, tel, ressembler</i>) : « fort comme un lion ».</li>
<li><b>Métaphore</b> : comparaison sans outil : « cet homme est un lion ».</li>
<li><b>Personnification</b> : attribuer des traits humains à une chose : « la nuit nous accueille ».</li>
<li><b>Hyperbole</b> : exagération : « je meurs de faim ».</li>
<li><b>Antithèse</b> : opposition forte de deux termes : « la vie et la mort ».</li>
<li><b>Litote</b> : dire peu pour suggérer beaucoup : « ce n'est pas mauvais ».</li>
<li><b>Euphémisme</b> : adoucir une réalité dure : « il nous a quittés ».</li>
<li><b>Anaphore</b> : répétition d'un mot en début de phrases ; <b>Oxymore</b> : association de contraires : « un silence assourdissant ».</li>
</ul>
<p><b>Mots de liaison</b> : addition (<i>de plus, en outre</i>) ; opposition (<i>mais, cependant, pourtant</i>) ; cause (<i>car, parce que, puisque</i>) ; conséquence (<i>donc, c'est pourquoi, ainsi</i>) ; but (<i>afin que, pour que</i>) ; temps (<i>d'abord, ensuite, enfin</i>).</p>`},

/* ================= FRANÇAIS — GRAMMAIRE ================= */
{id:"c_fr_g1",m:"fr",t:"Règles grammaticales 1 : nature et fonction des mots",h:`
<p><b>Nature (classe grammaticale)</b> : <b>nom, déterminant, adjectif, pronom, verbe, adverbe, préposition, conjonction, interjection</b>.</p>
<ul>
<li><b>Variables</b> : nom, déterminant, adjectif, pronom, verbe.</li>
<li><b>Invariables</b> : adverbe, préposition, conjonction, interjection.</li>
</ul>
<p><b>Fonctions</b> :</p>
<ul>
<li><b>Sujet</b> : qui fait l'action (<i>qui est-ce qui ?</i>).</li>
<li><b>COD</b> : complément direct, sans préposition (<i>je lis un livre</i>) → question : <i>quoi ? qui ?</i></li>
<li><b>COI</b> : complément indirect, avec préposition à / de (<i>je parle à Paul</i>).</li>
<li><b>Attribut du sujet</b> : après un verbe d'état (<i>être, sembler, paraître, devenir, rester</i>) : « Il est <u>fort</u> ».</li>
<li><b>Épithète</b> : adjectif directement joint au nom : « un <u>grand</u> arbre ».</li>
<li><b>Complément circonstanciel (CC)</b> : lieu, temps, manière, cause, but, moyen (<i>hier, à Ouaga, rapidement</i>) ; supprimable et déplaçable.</li>
<li><b>Complément du nom</b> : « la maison <u>de mon père</u> ».</li>
</ul>
<p><b>Types de phrases</b> : déclarative, interrogative, impérative, exclamative. <b>Formes</b> : affirmative / négative (<i>ne … pas, ne … jamais, ne … plus, ne … rien</i>) ; active / passive.</p>`},
{id:"c_fr_g2",m:"fr",t:"Règles grammaticales 2 : accord du participe passé",h:`
<ul>
<li><b>Sans auxiliaire</b> (employé comme adjectif) : s'accorde avec le nom → « des fruits <b>mûris</b> ».</li>
<li><b>Avec l'auxiliaire ÊTRE</b> : s'accorde avec le <b>sujet</b> → « Elles sont <b>parties</b> ».</li>
<li><b>Avec l'auxiliaire AVOIR</b> : s'accorde avec le <b>COD placé avant le verbe</b> ; sinon invariable → « Les fleurs que j'ai <b>cueillies</b> » mais « J'ai <b>cueilli</b> des fleurs ».</li>
<li><b>Verbes pronominaux</b> : accord avec le sujet si le pronom réfléchi est COD (« Elle s'est <b>lavée</b> ») ; invariable si le COD est placé après (« Elle s'est <b>lavé</b> les mains »).</li>
<li><b>Exceptions</b> : <i>coûté, pesé, couru, vécu, valu</i> (sens de durée, prix) restent invariables ; <i>fait + infinitif</i> invariable (« les maisons qu'il a <b>fait</b> construire »).</li>
<li>« en » COD : participe invariable (« des pommes, j'en ai <b>mangé</b> »).</li>
</ul>
<p><b>Astuce :</b> repère l'auxiliaire, puis cherche le COD en posant la question <i>quoi ?</i> après le verbe.</p>`},
{id:"c_fr_g3",m:"fr",t:"Règles grammaticales 3 : homophones grammaticaux",h:`
<ul>
<li><b>a / à</b> : a = verbe avoir (on peut dire « avait ») ; à = préposition.</li>
<li><b>on / ont</b> : on = pronom (« il ») ; ont = avoir (« avaient »).</li>
<li><b>son / sont</b> : son = déterminant (« le sien ») ; sont = être (« étaient »).</li>
<li><b>ce / se</b> : ce = démonstratif (« ce livre ») ; se = pronom réfléchi (« il se lave »).</li>
<li><b>ces / ses</b> : ces = démonstratif (« ces livres ») ; ses = possessif (« ses livres »).</li>
<li><b>c'est / s'est</b> : c'est = « cela est » ; s'est = « se + être ».</li>
<li><b>et / est</b> : et = « et puis » ; est = « était ».</li>
<li><b>ou / où</b> : ou = « ou bien » ; où = lieu ou temps.</li>
<li><b>la / l'a / là</b> : la = déterminant ou pronom ; l'a = « l' + a » (avoir) ; là = lieu.</li>
<li><b>leur / leurs</b> : pronom invariable (« je leur parle ») ; déterminant (« leur / leurs livres » selon le nombre d'objets).</li>
<li><b>quel(le)(s) / qu'elle(s)</b> : quel = déterminant (« quelle heure ? ») ; qu'elle = que + elle.</li>
<li><b>ma / m'a, ta / t'a</b> : m'a / t'a = pronom + avoir.</li>
<li><b>mes / mais, peu / peut, quand / quant / qu'en, sans / s'en / cent</b>.</li>
</ul>`},
{id:"c_fr_g4",m:"fr",t:"Règles grammaticales 4 : pluriel et féminin",h:`
<p><b>Pluriel des noms</b> : on ajoute -s. Exceptions :</p>
<ul>
<li>-s, -x, -z : invariables (<i>un nez → des nez</i>).</li>
<li>-eau, -au, -eu : -x (<i>bateaux, tuyaux, cheveux</i>) ; exceptions : <i>landau, sarrau, bleu, pneu → -s</i>.</li>
<li>-ou : -s ; sept exceptions en -x : <i>bijou, caillou, chou, genou, hibou, joujou, pou</i>.</li>
<li>-al : -aux (<i>cheval → chevaux</i>) ; exceptions : <i>bal, carnaval, festival, récital, régal → -s</i>.</li>
<li>-ail : -s (<i>détails</i>) ; exceptions : <i>travail, corail, émail, vitrail, bail → -aux</i>.</li>
<li>Irréguliers : <i>œil → yeux, ciel → cieux, monsieur → messieurs</i>.</li>
</ul>
<p><b>Féminin</b> : on ajoute généralement -e (<i>ami → amie</i>). Cas particuliers : -er → -ère (<i>berger → bergère</i>) ; -eur → -euse (<i>chanteur → chanteuse</i>) ; -teur → -trice (<i>acteur → actrice</i>) ; -eux → -euse ; -f → -ve (<i>neuf → neuve</i>) ; -on → -onne (<i>bon → bonne</i>) ; irréguliers : <i>roi → reine, loup → louve, héros → héroïne</i>.</p>
<p><b>Adjectifs de couleur</b> : s'accordent, sauf ceux issus d'un nom (<i>marron, orange</i>) et les composés (<i>vert clair</i>). <b>Adjectif « tout »</b> : <i>tout, toute, tous, toutes</i>. <b>« même », « demi »</b> : voir cas particuliers.</p>`},
{id:"c_fr_g5",m:"fr",t:"Règles grammaticales 5 : propositions, coordination et subordination",h:`
<p><b>Coordination</b> : relie deux éléments de même fonction avec <b>mais, ou, et, donc, or, ni, car</b>.</p>
<p><b>Juxtaposition</b> : propositions séparées par une virgule ou un point-virgule.</p>
<p><b>Subordination</b> : une proposition dépend d'une autre.</p>
<ul>
<li><b>Complétive</b> : COD ou sujet du verbe (<i>je pense <u>que tu viendras</u></i>).</li>
<li><b>Relative</b> : complète un nom, introduite par <i>qui, que, dont, où, lequel</i>.</li>
<li><b>Circonstancielle</b> : temps (<i>quand, lorsque, dès que</i>), cause (<i>parce que, puisque, comme</i>), conséquence (<i>si bien que, tellement … que</i>), but (<i>pour que, afin que</i> + subjonctif), opposition/concession (<i>bien que, quoique</i> + subjonctif), condition (<i>si</i> + présent/imparfait).</li>
</ul>
<p><b>Après « si »</b> : si + présent → futur ; si + imparfait → conditionnel présent ; si + plus-que-parfait → conditionnel passé. <b>Jamais de futur ni de conditionnel après « si » de condition.</b></p>
<p><b>Discours direct / indirect</b> : « Il dit : “Je viens” » → « Il dit qu'il vient ». Les pronoms, les temps et les marques de temps changent.</p>`},

/* ================= FRANÇAIS — CONJUGAISON ================= */
{id:"c_fr_j1",m:"fr",t:"Conjugaison 1 : groupes, modes et temps",h:`
<p><b>Les trois groupes</b> :</p>
<ul><li><b>1er groupe</b> : infinitif en <b>-er</b> (sauf <i>aller</i>) : parler, chanter.</li><li><b>2e groupe</b> : infinitif en <b>-ir</b>, participe présent en <b>-issant</b> : finir, choisir.</li><li><b>3e groupe</b> : tous les autres (aller, venir, prendre, voir, dire, faire…).</li></ul>
<p><b>Modes</b> : <b>indicatif</b> (réalité : présent, imparfait, passé simple, futur simple, passé composé, plus-que-parfait, futur antérieur) ; <b>conditionnel</b> (hypothèse) ; <b>subjonctif</b> (souhait, doute, nécessité) ; <b>impératif</b> (ordre) ; <b>infinitif, participe, gérondif</b> (modes impersonnels).</p>
<p><b>Temps simples / composés</b> : temps composé = auxiliaire (<i>avoir</i> ou <i>être</i>) conjugué + participe passé. Se conjuguent avec <b>être</b> : verbes de mouvement/changement d'état (<i>aller, venir, partir, arriver, naître, mourir, tomber, rester</i>…) et les verbes pronominaux.</p>
<p><b>Emploi des temps</b> : <i>imparfait</i> = habitude, description, action en cours dans le passé ; <i>passé simple</i> = action ponctuelle achevée (récit) ; <i>passé composé</i> = action achevée liée au présent ; <i>plus-que-parfait</i> = action antérieure à une autre passée ; <i>futur antérieur</i> = action achevée avant une autre future.</p>`},
{id:"c_fr_j2",m:"fr",t:"Conjugaison 2 : terminaisons des temps simples",h:`
<p><b>Présent (1er groupe)</b> : -e, -es, -e, -ons, -ez, -ent. <b>2e groupe</b> : -is, -is, -it, -issons, -issez, -issent. <b>3e groupe</b> (souvent) : -s, -s, -t, -ons, -ez, -ent.</p>
<p><b>Imparfait</b> (radical de « nous » au présent) : <b>-ais, -ais, -ait, -ions, -iez, -aient</b> (<i>nous mangeons → je mangeais</i>).</p>
<p><b>Futur simple</b> (infinitif ou radical irrégulier) : <b>-ai, -as, -a, -ons, -ez, -ont</b> (<i>je parlerai, tu finiras</i>).</p>
<p><b>Conditionnel présent</b> : radical du futur + terminaisons de l'imparfait : <b>-ais, -ais, -ait, -ions, -iez, -aient</b> (<i>je parlerais</i>).</p>
<p><b>Passé simple</b> : 1er groupe : -ai, -as, -a, -âmes, -âtes, -èrent ; 2e groupe : -is, -is, -it, -îmes, -îtes, -irent ; 3e groupe : -is/-us/-ins (<i>il prit, il fut, il vint</i>).</p>
<p><b>Subjonctif présent</b> : <b>-e, -es, -e, -ions, -iez, -ent</b> (<i>que je parle, que nous finissions</i>). Irréguliers : <i>être → que je sois ; avoir → que j'aie ; aller → que j'aille ; faire → que je fasse ; pouvoir → que je puisse ; savoir → que je sache</i>.</p>
<p><b>Particularités orthographiques</b> :</p>
<ul><li><b>-ger</b> : on garde le e devant a, o (<i>mangeons, mangeais</i>).</li><li><b>-cer</b> : ç devant a, o (<i>commençons, commençais</i>).</li><li><b>-yer</b> : y → i devant e muet (<i>j'essuie, il paiera</i>).</li><li><b>-eler / -eter</b> : doublement ou accent (<i>j'appelle, il jette, il achète</i>).</li></ul>`},
{id:"c_fr_j3",m:"fr",t:"Conjugaison 3 : verbes irréguliers essentiels",h:`
<ul>
<li><b>ÊTRE</b> : je suis, tu es, il est, nous sommes, vous êtes, ils sont ; imparfait : j'étais ; futur : je serai ; subj. : que je sois ; part. passé : été.</li>
<li><b>AVOIR</b> : j'ai, tu as, il a, nous avons, vous avez, ils ont ; futur : j'aurai ; subj. : que j'aie ; part. passé : eu.</li>
<li><b>ALLER</b> : je vais, tu vas, il va, nous allons, vous allez, ils vont ; futur : j'irai ; subj. : que j'aille.</li>
<li><b>FAIRE</b> : je fais, tu fais, il fait, nous faisons, vous faites, ils font ; futur : je ferai ; subj. : que je fasse ; part. : fait.</li>
<li><b>DIRE</b> : je dis, … vous dites, ils disent ; futur : je dirai ; part. : dit.</li>
<li><b>VENIR</b> : je viens, … nous venons, ils viennent ; futur : je viendrai ; passé simple : il vint ; part. : venu (auxiliaire être).</li>
<li><b>PRENDRE</b> : je prends, … nous prenons, ils prennent ; futur : je prendrai ; part. : pris.</li>
<li><b>POUVOIR</b> : je peux, tu peux, il peut, … ils peuvent ; futur : je pourrai ; part. : pu.</li>
<li><b>VOULOIR</b> : je veux, … ils veulent ; futur : je voudrai ; part. : voulu.</li>
<li><b>VOIR</b> : je vois, … nous voyons, ils voient ; futur : je verrai ; part. : vu.</li>
<li><b>SAVOIR</b> : je sais, … nous savons ; futur : je saurai ; subj. : que je sache ; part. : su.</li>
<li><b>DEVOIR</b> : je dois, … nous devons, ils doivent ; futur : je devrai ; part. : dû.</li>
</ul>
<p><b>Participes passés à retenir</b> : mettre → mis ; écrire → écrit ; lire → lu ; ouvrir → ouvert ; offrir → offert ; naître → né ; mourir → mort ; boire → bu ; connaître → connu ; recevoir → reçu ; vivre → vécu ; courir → couru ; rire → ri ; suivre → suivi ; croire → cru.</p>`},
{id:"c_fr_j4",m:"fr",t:"Conjugaison 4 : impératif, subjonctif et temps composés",h:`
<p><b>Impératif présent</b> : 3 personnes seulement (tu, nous, vous), sans sujet. 1er groupe : le « s » de la 2e personne disparaît : « <i>Mange !</i> » mais « <i>Manges-en</i> » (liaison). <b>Irréguliers</b> : <i>être → sois, soyons, soyez ; avoir → aie, ayons, ayez ; savoir → sache, sachons, sachez</i>.</p>
<p><b>Subjonctif</b> : après <i>il faut que, vouloir que, craindre que, bien que, pour que, avant que, afin que, à condition que</i>. Exemple : « Il faut que tu <b>viennes</b>. »</p>
<p><b>Temps composés</b> : <b>passé composé</b> (j'ai mangé, je suis parti), <b>plus-que-parfait</b> (j'avais mangé), <b>futur antérieur</b> (j'aurai mangé), <b>conditionnel passé</b> (j'aurais mangé), <b>subjonctif passé</b> (que j'aie mangé).</p>
<p><b>Participe présent / gérondif</b> : participe présent invariable (<i>chantant</i>) ; gérondif = « en » + participe présent (<i>en chantant</i>).</p>
<p><b>Concordance des temps</b> : verbe principal au présent → subordonnée au présent ou futur ; verbe principal au passé → subordonnée à l'imparfait ou au plus-que-parfait.</p>`},

/* ================= MATHÉMATIQUES ================= */
{id:"c_ma_1",m:"math",t:"Arithmétique : divisibilité, PGCD, PPCM, fractions, puissances",h:`
<ul>
<li><b>Divisibilité</b> : par 2 (chiffre final pair) ; par 3 (somme des chiffres multiple de 3) ; par 4 (deux derniers chiffres multiples de 4) ; par 5 (finit par 0 ou 5) ; par 9 (somme des chiffres multiple de 9) ; par 10 (finit par 0).</li>
<li><b>Nombre premier</b> : exactement deux diviseurs (1 et lui-même) : 2, 3, 5, 7, 11, 13, 17, 19, 23, 29…</li>
<li><b>PGCD(a ; b)</b> : plus grand diviseur commun (algorithme d'Euclide : a = b×q + r, puis PGCD(b ; r)…). <b>PPCM</b> : plus petit multiple commun. Relation : <b>PGCD × PPCM = a × b</b>.</li>
<li><b>Fractions</b> : a/b + c/d = (ad + bc)/bd ; a/b × c/d = ac/bd ; a/b ÷ c/d = a/b × d/c ; simplifier = diviser haut et bas par le PGCD.</li>
<li><b>Puissances</b> : aᵐ × aⁿ = aᵐ⁺ⁿ ; aᵐ ÷ aⁿ = aᵐ⁻ⁿ ; (aᵐ)ⁿ = aᵐⁿ ; a⁰ = 1 ; a⁻ⁿ = 1/aⁿ ; (ab)ⁿ = aⁿbⁿ.</li>
<li><b>Racines carrées</b> : √(ab) = √a × √b ; √(a/b) = √a / √b ; √(a²) = |a|.</li>
<li><b>Ordre des opérations</b> : parenthèses, puissances, × et ÷, puis + et −.</li>
<li><b>Notation scientifique</b> : a × 10ⁿ avec 1 ≤ a < 10.</li>
</ul>`},
{id:"c_ma_2",m:"math",t:"Proportionnalité, pourcentages, vitesse, intérêts, conversions",h:`
<ul>
<li><b>Proportionnalité</b> : produit en croix. Si a/b = c/d alors a × d = b × c.</li>
<li><b>Pourcentage d'une quantité</b> : quantité × taux ÷ 100. <b>Taux</b> = partie ÷ total × 100.</li>
<li><b>Augmentation de t %</b> : multiplier par (1 + t/100). <b>Baisse de t %</b> : multiplier par (1 − t/100). <b>Retour au prix initial</b> : diviser par le coefficient.</li>
<li><b>Vitesse</b> : v = d ÷ t ; d = v × t ; t = d ÷ v. Conversion : 1 m/s = 3,6 km/h.</li>
<li><b>Intérêt simple</b> : I = C × t × n ÷ 100 (n en années). <b>Intérêt composé</b> : C × (1 + t/100)ⁿ.</li>
<li><b>Moyenne pondérée</b> : Σ(valeur × coefficient) ÷ Σ coefficients.</li>
<li><b>Conversions</b> : 1 km = 1 000 m ; 1 m = 100 cm ; 1 t = 1 000 kg ; 1 kg = 1 000 g ; 1 L = 1 000 mL ; 1 m³ = 1 000 L ; 1 ha = 10 000 m² ; 1 h = 60 min ; 1 min = 60 s ; 1 jour = 24 h.</li>
<li><b>Partage proportionnel</b> : pour partager S en parts proportionnelles à a, b, c : une part vaut S ÷ (a + b + c).</li>
</ul>`},
{id:"c_ma_3",m:"math",t:"Algèbre : identités, équations, systèmes, second degré, suites",h:`
<ul>
<li><b>Identités remarquables</b> : (a + b)² = a² + 2ab + b² ; (a − b)² = a² − 2ab + b² ; a² − b² = (a − b)(a + b).</li>
<li><b>Équation du 1er degré</b> : ax + b = c ⇒ x = (c − b) ÷ a. Quand on change de membre, on change de signe.</li>
<li><b>Système 2×2</b> : par substitution (exprimer une inconnue) ou par combinaison (additionner/soustraire les équations).</li>
<li><b>Inéquation</b> : on garde le sens, sauf si on multiplie ou divise par un nombre négatif (on inverse le sens).</li>
<li><b>Second degré</b> : ax² + bx + c = 0 ; Δ = b² − 4ac. Si Δ > 0 : x = (−b ± √Δ) ÷ 2a ; si Δ = 0 : x = −b ÷ 2a ; si Δ < 0 : pas de solution réelle. Somme des racines = −b/a ; produit = c/a.</li>
<li><b>Suite arithmétique</b> (raison r) : uₙ = u₀ + n·r ; somme des n premiers termes : n × (premier + dernier) ÷ 2.</li>
<li><b>Suite géométrique</b> (raison q) : uₙ = u₀ · qⁿ ; somme : u₀ × (1 − qⁿ⁺¹) ÷ (1 − q).</li>
<li><b>Somme de 1 à n</b> : n(n + 1) ÷ 2.</li>
<li><b>Fonction affine</b> : f(x) = ax + b ; a = coefficient directeur, b = ordonnée à l'origine.</li>
</ul>`},
{id:"c_ma_4",m:"math",t:"Géométrie plane : périmètres, aires, angles, Pythagore, Thalès",h:`
<ul>
<li><b>Rectangle</b> : P = 2(L + l) ; A = L × l. <b>Carré</b> : P = 4c ; A = c².</li>
<li><b>Triangle</b> : A = base × hauteur ÷ 2. Somme des angles = <b>180°</b>.</li>
<li><b>Parallélogramme</b> : A = base × hauteur. <b>Losange</b> : A = D × d ÷ 2. <b>Trapèze</b> : A = (B + b) × h ÷ 2.</li>
<li><b>Cercle</b> : C = 2πr = πd ; <b>disque</b> : A = πr² (π ≈ 3,14).</li>
<li><b>Polygone à n côtés</b> : somme des angles = (n − 2) × 180° ; quadrilatère : 360°.</li>
<li><b>Pythagore</b> (triangle rectangle) : a² + b² = c² (c = hypoténuse). Triplets : (3,4,5), (5,12,13), (8,15,17).</li>
<li><b>Thalès</b> : si (MN) // (BC) alors AM/AB = AN/AC = MN/BC.</li>
<li><b>Trigonométrie</b> (triangle rectangle) : sin = côté opposé ÷ hypoténuse ; cos = côté adjacent ÷ hypoténuse ; tan = opposé ÷ adjacent ; sin² + cos² = 1.</li>
<li><b>Angles</b> : complémentaires (somme 90°), supplémentaires (somme 180°) ; angles opposés par le sommet égaux ; angle inscrit = moitié de l'angle au centre.</li>
<li><b>Distance entre deux points</b> : √[(x₂ − x₁)² + (y₂ − y₁)²] ; milieu : ((x₁ + x₂)/2 ; (y₁ + y₂)/2).</li>
</ul>`},
{id:"c_ma_5",m:"math",t:"Géométrie dans l'espace : volumes et aires",h:`
<ul>
<li><b>Cube</b> (arête a) : V = a³ ; aire totale = 6a².</li>
<li><b>Pavé droit</b> (L, l, h) : V = L × l × h ; aire totale = 2(Ll + lh + Lh).</li>
<li><b>Prisme / cylindre</b> : V = aire de la base × hauteur ; cylindre : V = πr²h ; aire latérale = 2πrh.</li>
<li><b>Pyramide / cône</b> : V = (1/3) × aire de la base × hauteur ; cône : V = (1/3)πr²h.</li>
<li><b>Sphère</b> (rayon r) : V = (4/3)πr³ ; aire = 4πr².</li>
<li><b>Unités</b> : 1 m³ = 1 000 dm³ = 1 000 L ; 1 dm³ = 1 L ; 1 cm³ = 1 mL.</li>
</ul>`},
{id:"c_ma_6",m:"math",t:"Statistiques et probabilités",h:`
<ul>
<li><b>Moyenne</b> = somme des valeurs ÷ effectif total.</li>
<li><b>Médiane</b> : valeur qui partage la série ordonnée en deux groupes de même effectif (effectif impair : valeur centrale ; pair : moyenne des deux valeurs centrales).</li>
<li><b>Mode</b> : valeur la plus fréquente. <b>Étendue</b> = max − min.</li>
<li><b>Fréquence</b> = effectif ÷ effectif total (en % : × 100).</li>
<li><b>Probabilité</b> = nombre de cas favorables ÷ nombre de cas possibles (entre 0 et 1). P(contraire) = 1 − P(A). Événements incompatibles : P(A ou B) = P(A) + P(B).</li>
<li><b>Dénombrement</b> : n! = n × (n−1) × … × 1 ; permutations de n objets : n! ; combinaisons : C(n,p) = n! ÷ [p!(n−p)!].</li>
</ul>`},

/* ================= HISTOIRE ================= */
{id:"c_hi_1",m:"hist",t:"Empires et royaumes de l'Afrique de l'Ouest",h:`
<ul>
<li><b>Empire du Ghana (Wagadou)</b> : Ve-XIe siècles ; capitale Koumbi Saleh ; richesse : or et sel ; roi : le <i>Tounka</i> ; déclin après les Almoravides (XIe s.).</li>
<li><b>Empire du Mali</b> : fondé par <b>Soundiata Keïta</b> après la bataille de <b>Kirina (1235)</b> ; apogée sous <b>Kankou Moussa</b> (pèlerinage à La Mecque en 1324) ; villes : Niani, Tombouctou, Djenné ; Charte du Manden.</li>
<li><b>Empire songhaï</b> : capitale <b>Gao</b> ; <b>Sonni Ali Ber</b> (1464-1492) ; <b>Askia Mohamed</b> (1493-1528) organise l'État ; chute après la bataille de <b>Tondibi (1591)</b> face aux Marocains.</li>
<li><b>Kanem-Bornou</b> : autour du lac Tchad (IXe-XIXe siècle).</li>
<li><b>Royaumes mossi</b> (XIe-XVe s.) : <b>Tenkodogo, Ouagadougou, Yatenga (Ouahigouya), Fada N'Gourma</b> ; ancêtre légendaire : <b>Yennenga</b> et son fils <b>Ouédraogo</b> ; souverain de Ouagadougou : le <b>Mogho Naaba</b> ; ils résistent longtemps aux grands empires.</li>
<li><b>Gwiriko</b> (début XVIIIe s., Bobo-Dioulasso) ; <b>Kénédougou</b> (Sikasso) : rois <b>Tiéba</b> puis <b>Babemba Traoré</b>, siège de Sikasso en 1898.</li>
<li><b>Empires du XIXe siècle</b> : <b>El Hadj Omar Tall</b> (Toucouleur), <b>Samory Touré</b> (Wassoulou, arrêté en 1898), <b>Sékou Amadou</b> (empire peul du Macina).</li>
<li><b>Côte guinéenne</b> : Dahomey (Abomey, roi <b>Béhanzin</b>), Ashanti (Kumasi), Bénin, Oyo.</li>
<li><b>Commerce transsaharien</b> : or, sel, esclaves, cola, tissus ; villes caravanières : Tombouctou, Gao, Agadez.</li>
</ul>`},
{id:"c_hi_2",m:"hist",t:"Colonisation et décolonisation (Haute-Volta, AOF)",h:`
<ul>
<li><b>1884-1885</b> : Conférence de Berlin : règles du partage de l'Afrique.</li>
<li><b>1895</b> : création de l'<b>AOF</b> (capitale Dakar) ; 1910 : <b>AEF</b>.</li>
<li><b>1896</b> : prise de Ouagadougou par les Français ; <b>1898</b> : capture de Samory.</li>
<li><b>1915-1916</b> : grande révolte du Bani-Volta contre la conscription et l'impôt.</li>
<li><b>1919</b> : création de la colonie de <b>Haute-Volta</b> ; <b>1932</b> : suppression et partage entre Soudan, Niger et Côte d'Ivoire ; <b>1947</b> : <b>reconstitution</b>.</li>
<li><b>1944</b> : conférence de Brazzaville ; <b>1946</b> : abolition du travail forcé (loi Houphouët-Boigny), création du RDA.</li>
<li><b>1956</b> : loi-cadre Defferre ; <b>1958</b> : référendum (28 septembre) et proclamation de la République de Haute-Volta (11 décembre) ; décès d'Ouezzin Coulibaly.</li>
<li><b>1959</b> : Conseil de l'Entente ; <b>5 août 1960</b> : indépendance de la Haute-Volta (<b>Maurice Yaméogo</b>).</li>
<li><b>Année de l'Afrique : 1960</b> (une quinzaine de pays indépendants). Ghana : 1957 (Nkrumah) ; Guinée : 1958 (Sékou Touré) ; Congo (RDC) : 1960 ; Algérie : 1962 ; Soudan du Sud : 2011.</li>
<li><b>Panafricanisme</b> : congrès de Manchester (1945), Nkrumah, Bandung (1955), OUA (1963) → UA (2002).</li>
</ul>`},
{id:"c_hi_3",m:"hist",t:"Histoire politique du Burkina Faso (résumé)",h:`
<ul>
<li><b>1960-1966</b> Maurice Yaméogo (Ire République) → soulèvement du 3 janvier 1966.</li>
<li><b>1966-1980</b> Sangoulé Lamizana (régime militaire puis IIe et IIIe Républiques).</li>
<li><b>1980-1982</b> Saye Zerbo (CMRPN) ; <b>1982-1983</b> Jean-Baptiste Ouédraogo (CSP).</li>
<li><b>1983-1987</b> Thomas Sankara (CNR) ; <b>4 août 1984</b> : « Burkina Faso ».</li>
<li><b>1987-2014</b> Blaise Compaoré ; Constitution du <b>2 juin 1991</b> ; insurrection des 30-31 octobre 2014.</li>
<li><b>2014-2015</b> Michel Kafando (transition) ; <b>2015-2022</b> Roch Marc Christian Kaboré.</li>
<li><b>2022</b> Paul-Henri Sandaogo Damiba (janvier-septembre) ; depuis le <b>30 septembre 2022</b> : <b>Ibrahim Traoré</b>.</li>
<li><b>Dates récentes</b> : Charte de la transition (14 octobre 2022, révisée le 25 mai 2024) ; AES (16 septembre 2023, Confédération 6 juillet 2024) ; retrait de la CEDEAO (29 janvier 2025) ; nouveau découpage 17 régions et 47 provinces (2025) ; dissolution des partis (29 janvier 2026) ; Charte de la Révolution (27 mars 2026).</li>
</ul>
<p>Détails (mandats, gouvernements, biographies, bibliographie) : <b>Réviser › Culture générale › Repères du Burkina Faso</b>.</p>`},
{id:"c_hi_4",m:"hist",t:"Relations internationales : organisations et traités",h:`
<ul>
<li><b>ONU</b> (1945, San Francisco ; siège New York) : Assemblée générale (193 États), <b>Conseil de sécurité</b> (15 membres dont 5 permanents avec droit de veto : États-Unis, Russie, Chine, France, Royaume-Uni), Secrétariat, <b>CIJ</b> (La Haye), ECOSOC.</li>
<li><b>Institutions spécialisées</b> : UNESCO (Paris, 1945), FAO (Rome, 1945), OMS (Genève, 1948), UNICEF (1946), OIT, HCR, PNUD.</li>
<li><b>FMI et Banque mondiale</b> : Bretton Woods (1944) ; <b>OMC</b> : 1995 (Genève). <b>CPI</b> : Statut de Rome (1998), siège La Haye.</li>
<li><b>OUA</b> : 25 mai 1963, Addis-Abeba → <b>Union africaine</b> : 2002 (55 membres, siège Addis-Abeba).</li>
<li><b>CEDEAO</b> : 1975 (Lagos), siège Abuja. <b>UEMOA</b> : traité de Dakar, 10 janvier 1994 (8 États, Commission à Ouagadougou, FCFA, BCEAO à Dakar). <b>OHADA</b> : 1993.</li>
<li><b>AES / Confédération</b> : Burkina Faso, Mali, Niger (Charte du Liptako-Gourma 2023 ; Confédération 6 juillet 2024) ; Force unifiée, BCID-AES, Parlement confédéral (août 2026).</li>
<li><b>Europe</b> : traité de Rome (1957), traité de Maastricht (1992), euro (2002), Brexit (2020). <b>OTAN</b> : 1949.</li>
<li><b>Mouvements</b> : Bandung (1955), Non-alignés (Belgrade, 1961). <b>Guerre froide</b> : 1947-1991 ; chute du mur de Berlin 1989 ; URSS dissoute 1991.</li>
<li><b>Diplomatie</b> : ambassadeur (représente l'État), consul (protège les ressortissants), traité (accord entre États), ratification, veto, sanctions, médiation.</li>
</ul>`},
{id:"c_hi_5",m:"hist",t:"Grands événements du monde (repères chronologiques)",h:`
<ul>
<li><b>1492</b> Colomb en Amérique ; <b>1789</b> Révolution française ; <b>1884-85</b> Berlin.</li>
<li><b>1914-1918</b> Première Guerre mondiale ; <b>1917</b> Révolution russe ; <b>1919</b> traité de Versailles ; <b>1929</b> grande crise.</li>
<li><b>1939-1945</b> Seconde Guerre mondiale ; <b>1945</b> Yalta, ONU ; <b>1948</b> Déclaration universelle des droits de l'homme.</li>
<li><b>1957</b> traité de Rome ; <b>1961</b> Gagarine ; <b>1969</b> premiers pas sur la Lune.</li>
<li><b>1991-1994</b> fin de l'apartheid ; <b>1994</b> élection de Mandela ; génocide des Tutsi au Rwanda.</li>
<li><b>2001</b> attentats du 11 septembre ; <b>2011</b> indépendance du Soudan du Sud.</li>
</ul>`},

/* ================= GÉOGRAPHIE ================= */
{id:"c_ge_1",m:"geo",t:"Géographie du Burkina Faso",h:`
<ul>
<li><b>Situation</b> : Afrique de l'Ouest, pays <b>enclavé</b> ; superficie <b>≈ 274 200 km²</b> ; population ≈ 20,5 millions (recensement 2019).</li>
<li><b>Voisins (6)</b> : Mali (nord-ouest), Niger (est), Bénin et Togo (sud-est), Ghana (sud), Côte d'Ivoire (sud-ouest).</li>
<li><b>Relief</b> : vaste plateau d'altitude moyenne ≈ 400 m ; point culminant : <b>Ténakourou ≈ 749 m</b> ; falaises de Banfora, pics de Sindou, dômes de Fabédougou.</li>
<li><b>Climat</b> : tropical, deux saisons : <b>saison sèche</b> (harmattan, novembre-mai) et <b>saison des pluies</b> (juin-septembre) ; nord sahélien (moins de 600 mm), sud soudanien (plus de 900 mm).</li>
<li><b>Hydrographie</b> : bassin de la Volta (<b>Mouhoun = Volta Noire, Nakambé = Volta Blanche, Nazinon = Volta Rouge</b>), Comoé, Niger (affluents). Barrages : Ziga, Bagré, Kompienga, Samandéni.</li>
<li><b>Végétation</b> : steppe (Sahel), savane arbustive et arborée, forêts-galeries au sud-ouest.</li>
<li><b>Découpage</b> : <b>17 régions, 47 provinces</b> depuis 2025 (13 régions et 45 provinces auparavant) ; capitale politique <b>Ouagadougou</b> (région du Kadiogo), capitale économique <b>Bobo-Dioulasso</b>.</li>
<li><b>Économie</b> : agriculture et élevage (coton, sésame, karité, mil, sorgho), <b>or</b> (1er produit d'exportation).</li>
<li><b>Aires protégées</b> : parc national du W, parc d'Arly, parc de Pô (Kaboré Tambi), ranch de Nazinga. <b>Patrimoine mondial</b> : ruines de Loropéni (2009).</li>
</ul>`},
{id:"c_ge_2",m:"geo",t:"Afrique : capitales de l'Afrique de l'Ouest et du Sahel",h:`
<ul>
<li>Bénin : Porto-Novo (siège du gouvernement à Cotonou) · Burkina Faso : Ouagadougou · Cabo Verde : Praia · Côte d'Ivoire : Yamoussoukro (Abidjan = capitale économique)</li>
<li>Gambie : Banjul · Ghana : Accra · Guinée : Conakry · Guinée-Bissau : Bissau · Libéria : Monrovia</li>
<li>Mali : Bamako · Mauritanie : Nouakchott · Niger : Niamey · Nigeria : Abuja · Sénégal : Dakar · Sierra Leone : Freetown · Togo : Lomé · Tchad : N'Djamena</li>
</ul>
<p><b>Autres capitales à connaître</b> : Algérie : Alger · Maroc : Rabat · Tunisie : Tunis · Libye : Tripoli · Égypte : Le Caire · Cameroun : Yaoundé · Gabon : Libreville · Congo : Brazzaville · RDC : Kinshasa · Éthiopie : Addis-Abeba · Kenya : Nairobi · Tanzanie : Dodoma · Ouganda : Kampala · Rwanda : Kigali · Burundi : Gitega · Afrique du Sud : Pretoria (administrative) · Madagascar : Antananarivo · Mozambique : Maputo · Zimbabwe : Harare · Zambie : Lusaka · Namibie : Windhoek.</p>`},
{id:"c_ge_3",m:"geo",t:"Afrique : repères physiques et régions",h:`
<ul>
<li><b>Plus long fleuve</b> : le Nil (≈ 6 650 km) ; autres : Congo, Niger (≈ 4 180 km), Zambèze.</li>
<li><b>Plus haut sommet</b> : Kilimandjaro (Tanzanie, ≈ 5 890 m) ; autres : mont Kenya, Atlas.</li>
<li><b>Plus grand désert chaud</b> : le Sahara ; Kalahari et Namib en Afrique australe.</li>
<li><b>Plus grand lac</b> : Victoria ; autres : Tchad, Tanganyika, Malawi, Volta (artificiel).</li>
<li><b>Plus grand pays par la superficie</b> : Algérie ; <b>plus peuplé</b> : Nigeria.</li>
<li><b>Océans et mers</b> : Atlantique (ouest), océan Indien (est), Méditerranée (nord), mer Rouge (nord-est).</li>
<li><b>Canal de Suez</b> (Égypte) relie la Méditerranée à la mer Rouge. <b>Équateur</b> traverse le Gabon, le Congo, la RDC, l'Ouganda, le Kenya, la Somalie.</li>
<li><b>Climats</b> : équatorial (Congo, Guinée), tropical (savane, Sahel), désertique (Sahara), méditerranéen (Maghreb).</li>
<li><b>Sahel</b> : bande semi-aride au sud du Sahara (Mauritanie, Mali, Burkina Faso, Niger, Tchad…). Enjeux : sécheresse, désertification, sécurité alimentaire.</li>
</ul>`},
{id:"c_ge_4",m:"geo",t:"Monde : continents, océans, repères",h:`
<ul>
<li><b>Continents</b> : Afrique, Amérique, Antarctique, Asie, Europe, Océanie.</li>
<li><b>Océans</b> : Pacifique (le plus grand), Atlantique, Indien, Arctique, Austral.</li>
<li><b>Plus grand pays</b> : Russie ; <b>plus peuplé</b> : Inde (depuis 2023) ; plus grande île : Groenland.</li>
<li><b>Plus haut sommet</b> : Everest (≈ 8 849 m) ; <b>plus long fleuve d'Amérique du Sud</b> : Amazone ; Europe : Volga.</li>
<li><b>Lignes imaginaires</b> : équateur (0° de latitude), méridien de Greenwich (0° de longitude), tropiques du Cancer et du Capricorne, cercles polaires.</li>
<li><b>Capitales utiles</b> : Paris, Londres, Berlin, Rome, Madrid, Moscou, Pékin, Tokyo, New Delhi, Brasilia, Ottawa, Washington, Canberra, Ankara, Riyad.</li>
</ul>`}
];
const D=window.DATA;D.fiches=D.fiches.concat(F);
})();
