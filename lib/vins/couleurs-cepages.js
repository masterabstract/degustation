// Couleur des cépages (raisins noirs = rouges). Tous les autres cépages de la base sont des
// cépages blancs ou gris (Pinot Gris, Grenache Gris, Gewurztraminer…), qui donnent des vins blancs.
// Sert à présenter les cépages d'une appellation en « rouges » et « blancs » dans les pronostics.
const ROUGES = `
Abouriou, Acolon, Agiorgitiko, Aglianico, Aleatico, Aleksandrouli, Alfrocheiro, Alicante Bouschet, Amaral,
Ancellotta, Aragonez, Aramon, Arinarnoa, Babić, Băbească Neagră, Baboso Negro, Baga, Barbera, Bastardo,
Blauburgunder, Blauer Portugieser, Blauer Wildbacher, Blaufränkisch, Bobal, Bombino Nero, Bonarda, Bovale,
Brachetto, Brancellao, Braquet, Braucol, Cabernet Franc, Cabernet Sauvignon, Cadarcă, Cagnulari, Caíño Tinto,
Caladoc, Calitor, Callet, Canaiolo, Cannonau, Carcajolu, Carignan, Carignano, Cariñena, Carménère, Castelão,
Cesanese, César, Ciliegiolo, Cinsault, Colorino, Cornalin, Corvina, Corvinone, Côt, Counoise, Criolla,
Crljenak Kaštelanski, Croatina, Diolinoir, Dolcetto, Dornfelder, Duras, Durif, Egiodola, Fer Servadou,
Fetească Neagră, Folle Noire, Frankovka, Frappato, Freisa, Frühburgunder, Fumin, Gaglioppo, Gamaret, Gamay,
Gamza, Garanoir, Garnacha, Garnacha Peluda, Garnacha Tintorera, Girò, Graciano, Grenache, Grignolino, Grolleau,
Groppello, Hondarrabi Beltza, Humagne Rouge, Jaen, Juan García, Jurançon Noir, Kadarka, Kékfrankos, Kotsifali,
Krassato, Lacrima, Lagrein, Lambrusco, Lemberger, Liatiko, Limnio, Limniona, Listán Negro, Lledoner Pelut,
Magliocco, Malbec, Malvasia Nera, Mammolo, Mandilaria, Manto Negro, Maratheftiko, Marselan, Marzemino,
Maturana Tinta, Mavro, Mavrodaphne, Mavrotragano, Mavrud, Mayolet, Mazuelo, Melnik 55, Mencía, Merenzao,
Merlot, Messenikola, Minustellu, Modra Frankinja, Modrý Portugal, Molinara, Monastrell, Mondeuse, Monica,
Montepulciano, Moreto, Moristel, Moscato di Scanzo, Moscato Rosa, Mourvèdre, Mujuretuli, Muscardin, Nebbiolo,
Negoska, Negra Mole, Negramoll, Négrette, Negroamaro, Negru de Drăgășani, Nerello Cappuccio, Nerello Mascalese,
Nero d'Avola, Nero di Troia, Nielluccio, Nocera, Novac, Ojaleshi, Oseleta, Otskhanuri Sapere, País, Pamid,
Parraleta, Pelaverga, Perricone, Persan, Petit Rouge, Petit Verdot, Petite Sirah, Piedirosso, Pignolo,
Pineau d'Aunis, Pinenc, Pinot Meunier, Pinot Nero, Pinot Noir, Pinotage, Plant Robert, Plavac Mali, Portugieser,
Portugizac, Poulsard, Prieto Picudo, Primitivo, Prunelard, Raboso, Refosco, Refošk, Regent, Rondinella, Rösler,
Rossese, Rubin, Ruchè, Rufete, Sagrantino, Sangiovese, Sankt Laurent, Saperavi, Schiava, Schioppettino,
Schwarzriesling, Sciaccarellu, Shiraz, Shiroka Melnishka Loza, Sousão, Sousón, Spätburgunder, Stavroto, Sumoll,
Susumaniello, Svatovavřinecké, Syrah, Tai Rosso, Tannat, Tazzelenghe, Tempranillo, Teran, Teroldego, Terrano,
Terret Noir, Tibouren, Tinta Amarela, Tinta Barroca, Tinta Caiada, Tinta de Toro, Tinta Miúda, Tinta Negra,
Tinta Roriz, Tintilia, Tintilla de Rota, Tinto Cão, Tinto Fino, Touriga Franca, Touriga Nacional, Tribidrag,
Trincadeira, Trollinger, Trousseau, Uva Rara, Vaccarèse, Vernaccia Nera, Vespolina, Vijariego Negro, Vinhão,
Vlahiko, Xinomavro, Yiannoudi, Žametovka, Zinfandel, Zweigelt, Zweigeltrebe
`;

const fold = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const RED = new Set(ROUGES.split(',').map((g) => fold(g)).filter(Boolean));

/** 'rouge' pour un cépage noir, 'blanc' sinon. */
export function grapeColor(name) {
  return RED.has(fold(name)) ? 'rouge' : 'blanc';
}
