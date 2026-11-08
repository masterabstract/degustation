// Appellations viticoles françaises (AOC / AOP), classées par région.
// Format : Appellation | Couleurs | Cépages principaux
// Couleurs : R rouge, B blanc, O rosé, E effervescent, D doux / liquoreux / vin doux naturel.
// La couleur n'est pré-remplie que si l'appellation n'en a qu'une.
// Quatrième champ facultatif : IGP (vin de pays). Les vins sans indication
// géographique (Vin de France, etc.) sont ajoutés dans lib/appellations.js.

const PN = 'Pinot Noir';
const CH = 'Chardonnay';
const GA = 'Gamay';
const AL = 'Riesling, Gewurztraminer, Pinot Gris';
const BXR = 'Merlot, Cabernet Sauvignon, Cabernet Franc';
const MED = 'Cabernet Sauvignon, Merlot';
const LIB = 'Merlot, Cabernet Franc';
const BXB = 'Sauvignon Blanc, Sémillon';
const LIQ = 'Sémillon, Sauvignon Blanc, Muscadelle';
const RHS = 'Grenache, Syrah, Mourvèdre';
const LGD = 'Syrah, Grenache, Mourvèdre, Carignan';
const PROV = 'Grenache, Cinsault, Syrah';
const CHE = 'Chenin';
const CF = 'Cabernet Franc';
const SB = 'Sauvignon Blanc';

export const FRANCE = `
# Alsace
Alsace|BRO|${AL}, Pinot Blanc, Sylvaner, Muscat, Pinot Noir
Alsace Grand Cru|B|${AL}, Muscat
Crémant d'Alsace|E|Pinot Blanc, Auxerrois, Pinot Noir, Riesling, Chardonnay
Alsace Klevener de Heiligenstein|B|Savagnin Rose
Alsace Grand Cru Altenberg de Bergbieten|B|${AL}
Alsace Grand Cru Altenberg de Bergheim|B|${AL}
Alsace Grand Cru Altenberg de Wolxheim|B|${AL}
Alsace Grand Cru Brand|B|${AL}
Alsace Grand Cru Bruderthal|B|${AL}
Alsace Grand Cru Eichberg|B|${AL}
Alsace Grand Cru Engelberg|B|${AL}
Alsace Grand Cru Florimont|B|${AL}
Alsace Grand Cru Frankstein|B|${AL}
Alsace Grand Cru Froehn|B|${AL}
Alsace Grand Cru Furstentum|B|${AL}
Alsace Grand Cru Geisberg|B|${AL}
Alsace Grand Cru Gloeckelberg|B|${AL}
Alsace Grand Cru Goldert|B|${AL}
Alsace Grand Cru Hatschbourg|B|${AL}
Alsace Grand Cru Hengst|B|${AL}
Alsace Grand Cru Kaefferkopf|B|${AL}
Alsace Grand Cru Kanzlerberg|B|${AL}
Alsace Grand Cru Kastelberg|B|${AL}
Alsace Grand Cru Kessler|B|${AL}
Alsace Grand Cru Kirchberg de Barr|B|${AL}
Alsace Grand Cru Kirchberg de Ribeauvillé|B|${AL}
Alsace Grand Cru Kitterlé|B|${AL}
Alsace Grand Cru Mambourg|B|${AL}
Alsace Grand Cru Mandelberg|B|${AL}
Alsace Grand Cru Marckrain|B|${AL}
Alsace Grand Cru Moenchberg|B|${AL}
Alsace Grand Cru Muenchberg|B|${AL}
Alsace Grand Cru Ollwiller|B|${AL}
Alsace Grand Cru Osterberg|B|${AL}
Alsace Grand Cru Pfersigberg|B|${AL}
Alsace Grand Cru Pfingstberg|B|${AL}
Alsace Grand Cru Praelatenberg|B|${AL}
Alsace Grand Cru Rangen|B|${AL}
Alsace Grand Cru Rosacker|B|${AL}
Alsace Grand Cru Saering|B|${AL}
Alsace Grand Cru Schlossberg|B|${AL}
Alsace Grand Cru Schoenenbourg|B|${AL}
Alsace Grand Cru Sommerberg|B|${AL}
Alsace Grand Cru Sonnenglanz|B|${AL}
Alsace Grand Cru Spiegel|B|${AL}
Alsace Grand Cru Sporen|B|${AL}
Alsace Grand Cru Steinert|B|${AL}
Alsace Grand Cru Steingrubler|B|${AL}
Alsace Grand Cru Steinklotz|B|${AL}
Alsace Grand Cru Vorbourg|B|${AL}
Alsace Grand Cru Wiebelsberg|B|${AL}
Alsace Grand Cru Wineck-Schlossberg|B|${AL}
Alsace Grand Cru Winzenberg|B|${AL}
Alsace Grand Cru Zinnkoepflé|B|${AL}
Alsace Grand Cru Zotzenberg|B|${AL}

# Lorraine
Côtes de Toul|ROB|Gamay, Pinot Noir, Auxerrois
Moselle|BRO|Auxerrois, Pinot Gris, Pinot Noir

# Champagne
Champagne|E|${CH}, ${PN}, Pinot Meunier
Coteaux Champenois|RBO|${PN}, ${CH}, Pinot Meunier
Rosé des Riceys|O|${PN}

# Bourgogne
Bourgogne|RBO|${PN}, ${CH}
Bourgogne Aligoté|B|Aligoté
Bourgogne Mousseux|E|${PN}
Bourgogne Passe-Tout-Grains|RO|${PN}, ${GA}
Coteaux Bourguignons|RBO|${GA}, ${PN}, ${CH}
Crémant de Bourgogne|E|${CH}, ${PN}
Bourgogne Hautes-Côtes de Nuits|RBO|${PN}, ${CH}
Bourgogne Hautes-Côtes de Beaune|RBO|${PN}, ${CH}
Bourgogne Côte d'Or|RB|${PN}, ${CH}
Bourgogne Côte Chalonnaise|RBO|${PN}, ${CH}
Bourgogne Côtes d'Auxerre|RBO|${PN}, ${CH}
Bourgogne Chitry|RBO|${PN}, ${CH}
Bourgogne Coulanges-la-Vineuse|RBO|${PN}, ${CH}
Bourgogne Épineuil|RO|${PN}
Bourgogne Tonnerre|B|${CH}
Bourgogne Côte Saint-Jacques|RBO|${PN}, ${CH}
Petit Chablis|B|${CH}
Chablis|B|${CH}
Chablis Premier Cru|B|${CH}
Chablis Grand Cru|B|${CH}
Irancy|R|${PN}, César
Saint-Bris|B|${SB}, Sauvignon Gris
Vézelay|B|${CH}
Marsannay|RBO|${PN}, ${CH}
Fixin|RB|${PN}
Gevrey-Chambertin|R|${PN}
Chambertin|R|${PN}
Chambertin-Clos de Bèze|R|${PN}
Chapelle-Chambertin|R|${PN}
Charmes-Chambertin|R|${PN}
Griotte-Chambertin|R|${PN}
Latricières-Chambertin|R|${PN}
Mazis-Chambertin|R|${PN}
Mazoyères-Chambertin|R|${PN}
Ruchottes-Chambertin|R|${PN}
Morey-Saint-Denis|RB|${PN}
Clos de la Roche|R|${PN}
Clos Saint-Denis|R|${PN}
Clos de Tart|R|${PN}
Clos des Lambrays|R|${PN}
Bonnes-Mares|R|${PN}
Chambolle-Musigny|R|${PN}
Musigny|RB|${PN}
Vougeot|RB|${PN}
Clos de Vougeot|R|${PN}
Vosne-Romanée|R|${PN}
Échezeaux|R|${PN}
Grands-Échezeaux|R|${PN}
Richebourg|R|${PN}
Romanée-Conti|R|${PN}
Romanée-Saint-Vivant|R|${PN}
La Romanée|R|${PN}
La Tâche|R|${PN}
La Grande Rue|R|${PN}
Nuits-Saint-Georges|RB|${PN}
Côte de Nuits-Villages|RB|${PN}
Ladoix|RB|${PN}, ${CH}
Aloxe-Corton|RB|${PN}
Corton|RB|${PN}
Corton-Charlemagne|B|${CH}
Charlemagne|B|${CH}
Pernand-Vergelesses|RB|${PN}, ${CH}
Savigny-lès-Beaune|RB|${PN}, ${CH}
Chorey-lès-Beaune|RB|${PN}
Beaune|RB|${PN}, ${CH}
Côte de Beaune|RB|${PN}, ${CH}
Côte de Beaune-Villages|R|${PN}
Pommard|R|${PN}
Volnay|R|${PN}
Monthélie|RB|${PN}, ${CH}
Auxey-Duresses|RB|${PN}, ${CH}
Saint-Romain|RB|${CH}, ${PN}
Meursault|BR|${CH}
Blagny|R|${PN}
Puligny-Montrachet|BR|${CH}
Chassagne-Montrachet|BR|${CH}, ${PN}
Montrachet|B|${CH}
Chevalier-Montrachet|B|${CH}
Bâtard-Montrachet|B|${CH}
Bienvenues-Bâtard-Montrachet|B|${CH}
Criots-Bâtard-Montrachet|B|${CH}
Saint-Aubin|BR|${CH}, ${PN}
Santenay|RB|${PN}, ${CH}
Maranges|RB|${PN}
Bouzeron|B|Aligoté
Rully|BR|${CH}, ${PN}
Mercurey|RB|${PN}, ${CH}
Givry|RB|${PN}, ${CH}
Montagny|B|${CH}
Mâcon|BRO|${CH}, ${GA}
Mâcon-Villages|B|${CH}
Viré-Clessé|B|${CH}
Saint-Véran|B|${CH}
Pouilly-Fuissé|B|${CH}
Pouilly-Loché|B|${CH}
Pouilly-Vinzelles|B|${CH}

# Beaujolais
Beaujolais|ROB|${GA}
Beaujolais-Villages|ROB|${GA}
Beaujolais Nouveau|R|${GA}
Brouilly|R|${GA}
Côte de Brouilly|R|${GA}
Chénas|R|${GA}
Chiroubles|R|${GA}
Fleurie|R|${GA}
Juliénas|R|${GA}
Morgon|R|${GA}
Moulin-à-Vent|R|${GA}
Régnié|R|${GA}
Saint-Amour|R|${GA}
Coteaux du Lyonnais|RBO|${GA}, ${CH}

# Jura
Arbois|RBOD|Savagnin, ${CH}, Poulsard, Trousseau, ${PN}
Arbois Pupillin|RBO|Savagnin, ${CH}, Poulsard
Côtes du Jura|RBOD|${CH}, Savagnin, Poulsard, Trousseau, ${PN}
L'Étoile|BD|${CH}, Savagnin
Château-Chalon|B|Savagnin
Macvin du Jura|D|Savagnin, ${CH}, Poulsard
Crémant du Jura|E|${CH}, ${PN}, Poulsard

# Savoie
Savoie|BROE|Jacquère, Mondeuse, Altesse, ${GA}
Roussette de Savoie|B|Altesse
Seyssel|BE|Altesse, Molette
Crémant de Savoie|E|Jacquère, Altesse
Bugey|BROE|${CH}, ${GA}, Mondeuse, ${PN}
Roussette du Bugey|B|Altesse

# Loire
Muscadet|B|Melon de Bourgogne
Muscadet Sèvre et Maine|B|Melon de Bourgogne
Muscadet Coteaux de la Loire|B|Melon de Bourgogne
Muscadet Côtes de Grandlieu|B|Melon de Bourgogne
Gros Plant du Pays Nantais|B|Folle Blanche
Coteaux d'Ancenis|RO|${GA}
Fiefs Vendéens|RBO|${PN}, ${GA}, ${CHE}, ${CH}, Négrette
Anjou|RBE|${CF}, ${CHE}
Anjou-Villages|R|${CF}, Cabernet Sauvignon
Anjou-Villages Brissac|R|${CF}, Cabernet Sauvignon
Anjou Gamay|R|${GA}
Anjou Coteaux de la Loire|D|${CHE}
Rosé d'Anjou|O|Grolleau, ${CF}, ${GA}
Cabernet d'Anjou|O|${CF}, Cabernet Sauvignon
Rosé de Loire|O|${CF}, Grolleau, ${GA}, Pineau d'Aunis
Coteaux de l'Aubance|D|${CHE}
Coteaux du Layon|D|${CHE}
Bonnezeaux|D|${CHE}
Quarts de Chaume|D|${CHE}
Savennières|B|${CHE}
Savennières Roche aux Moines|B|${CHE}
Coulée de Serrant|B|${CHE}
Saumur|RBEO|${CF}, ${CHE}
Saumur-Champigny|R|${CF}
Saumur Puy-Notre-Dame|R|${CF}
Coteaux de Saumur|D|${CHE}
Cabernet de Saumur|O|${CF}
Crémant de Loire|E|${CHE}, ${CH}, ${CF}
Touraine|RBOE|${SB}, ${GA}, ${CF}, Côt
Touraine Amboise|RBO|${CHE}, Côt, ${GA}, ${CF}
Touraine Azay-le-Rideau|BO|${CHE}, Grolleau
Touraine Chenonceaux|RB|${SB}, Côt, ${CF}
Touraine Mesland|RBO|${GA}, ${CHE}, Côt
Touraine Noble Joué|O|Pinot Gris, Pinot Meunier, ${PN}
Touraine Oisly|B|${SB}
Chinon|RBO|${CF}
Bourgueil|RO|${CF}
Saint-Nicolas-de-Bourgueil|RO|${CF}
Vouvray|BED|${CHE}
Montlouis-sur-Loire|BED|${CHE}
Jasnières|B|${CHE}
Coteaux du Loir|RBO|Pineau d'Aunis, ${CHE}
Coteaux du Vendômois|RBO|Pineau d'Aunis, ${CHE}
Cheverny|RBO|${SB}, ${PN}, ${GA}
Cour-Cheverny|B|Romorantin
Valençay|RBO|${SB}, ${GA}, Côt
Orléans|RBO|Pinot Meunier, ${CH}
Orléans-Cléry|R|${CF}
Haut-Poitou|RBO|${SB}, ${CF}
Sancerre|BRO|${SB}, ${PN}
Pouilly-Fumé|B|${SB}
Pouilly-sur-Loire|B|Chasselas
Menetou-Salon|BRO|${SB}, ${PN}
Quincy|B|${SB}
Reuilly|BRO|${SB}, ${PN}, Pinot Gris
Coteaux du Giennois|RBO|${SB}, ${PN}, ${GA}
Châteaumeillant|RO|${GA}, ${PN}
Saint-Pourçain|RBO|${GA}, ${PN}, ${CH}, Tressallier
Côtes d'Auvergne|RBO|${GA}, ${PN}, ${CH}
Côte Roannaise|RO|${GA}
Côtes du Forez|RO|${GA}

# Vallée du Rhône
Côte-Rôtie|R|Syrah, Viognier
Condrieu|B|Viognier
Château-Grillet|B|Viognier
Saint-Joseph|RB|Syrah, Marsanne, Roussanne
Crozes-Hermitage|RB|Syrah, Marsanne, Roussanne
Hermitage|RB|Syrah, Marsanne, Roussanne
Cornas|R|Syrah
Saint-Péray|BE|Marsanne, Roussanne
Côtes du Rhône|RBO|${RHS}
Côtes du Rhône Villages|RBO|${RHS}
Côtes du Rhône Villages Plan de Dieu|R|${RHS}
Côtes du Rhône Villages Visan|RBO|${RHS}
Côtes du Rhône Villages Séguret|RBO|${RHS}
Côtes du Rhône Villages Sablet|RBO|${RHS}
Côtes du Rhône Villages Valréas|RBO|${RHS}
Côtes du Rhône Villages Massif d'Uchaux|R|${RHS}
Côtes du Rhône Villages Signargues|R|${RHS}
Côtes du Rhône Villages Chusclan|RO|${RHS}
Côtes du Rhône Villages Laudun|RBO|${RHS}
Côtes du Rhône Villages Sainte-Cécile|R|${RHS}
Côtes du Rhône Villages Vaison-la-Romaine|R|${RHS}
Côtes du Rhône Villages Nyons|R|${RHS}
Côtes du Rhône Villages Saint-Gervais|RBO|${RHS}
Côtes du Rhône Villages Gadagne|R|${RHS}
Côtes du Rhône Villages Puyméras|R|${RHS}
Côtes du Rhône Villages Roaix|R|${RHS}
Côtes du Rhône Villages Rochegude|R|${RHS}
Côtes du Rhône Villages Rousset-les-Vignes|R|${RHS}
Côtes du Rhône Villages Saint-Maurice|R|${RHS}
Côtes du Rhône Villages Saint-Pantaléon-les-Vignes|R|${RHS}
Côtes du Rhône Villages Suze-la-Rousse|R|${RHS}
Vinsobres|R|Grenache, Syrah
Rasteau|RD|Grenache, Syrah, Mourvèdre
Cairanne|RB|Grenache, Syrah, Mourvèdre
Gigondas|RO|Grenache, Syrah, Mourvèdre
Vacqueyras|RBO|Grenache, Syrah, Mourvèdre
Beaumes-de-Venise|R|Grenache, Syrah
Muscat de Beaumes-de-Venise|D|Muscat
Châteauneuf-du-Pape|RB|${RHS}, Cinsault, Clairette, Roussanne
Lirac|RBO|${RHS}, Cinsault
Tavel|O|Grenache, Cinsault
Ventoux|RBO|Grenache, Syrah, Cinsault
Luberon|RBO|Grenache, Syrah, Vermentino
Pierrevert|RBO|Grenache, Syrah
Costières de Nîmes|RBO|Grenache, Syrah, Mourvèdre
Duché d'Uzès|RBO|Syrah, Grenache, Viognier
Grignan-les-Adhémar|RBO|Grenache, Syrah
Côtes du Vivarais|RBO|Grenache, Syrah
Clairette de Die|E|Muscat, Clairette
Crémant de Die|E|Clairette
Coteaux de Die|B|Clairette
Châtillon-en-Diois|RBO|${GA}, ${CH}, Aligoté

# Provence
Côtes de Provence|ORB|${PROV}, Mourvèdre, Tibouren, Rolle
Côtes de Provence Sainte-Victoire|OR|${PROV}
Côtes de Provence Fréjus|OR|${PROV}, Tibouren
Côtes de Provence La Londe|ORB|${PROV}, Rolle
Côtes de Provence Pierrefeu|OR|${PROV}
Côtes de Provence Notre-Dame des Anges|OR|${PROV}
Coteaux d'Aix-en-Provence|ORB|${PROV}, Cabernet Sauvignon, Counoise
Coteaux Varois en Provence|ORB|${PROV}, Mourvèdre, Rolle
Bandol|ROB|Mourvèdre, Grenache, Cinsault
Cassis|BRO|Marsanne, Clairette, Ugni Blanc
Bellet|RBO|Rolle, Braquet, Folle Noire
Palette|RBO|Mourvèdre, Grenache, Clairette
Les Baux-de-Provence|ROB|Grenache, Syrah, Cabernet Sauvignon

# Corse
Corse|ROB|Nielluccio, Sciaccarellu, Vermentino
Corse Calvi|ROB|Nielluccio, Sciaccarellu, Vermentino
Corse Figari|ROB|Nielluccio, Sciaccarellu, Vermentino
Corse Porto-Vecchio|ROB|Nielluccio, Sciaccarellu, Vermentino
Corse Sartène|ROB|Sciaccarellu, Nielluccio, Vermentino
Corse Coteaux du Cap Corse|ROB|Vermentino, Nielluccio
Ajaccio|ROB|Sciaccarellu, Vermentino
Patrimonio|RBO|Nielluccio, Vermentino
Muscat du Cap Corse|D|Muscat

# Languedoc
Languedoc|RBO|${LGD}
Languedoc Grès de Montpellier|R|${LGD}
Languedoc Pézenas|R|${LGD}
Languedoc Sommières|R|${LGD}
Languedoc Montpeyroux|R|${LGD}
Languedoc Saint-Saturnin|R|${LGD}
Languedoc Cabrières|RO|${LGD}, Cinsault
Languedoc Saint-Georges-d'Orques|R|${LGD}
Languedoc Quatourze|R|${LGD}
Languedoc La Méjanelle|R|${LGD}
Languedoc Saint-Christol|R|${LGD}
Languedoc Saint-Drézéry|R|${LGD}
Pic Saint-Loup|RO|Syrah, Grenache, Mourvèdre
Terrasses du Larzac|R|Syrah, Grenache, Mourvèdre
Faugères|RBO|Syrah, Grenache, Mourvèdre, Carignan
Saint-Chinian|RBO|Syrah, Grenache, Mourvèdre, Carignan
Saint-Chinian Berlou|R|Carignan, Syrah, Grenache
Saint-Chinian Roquebrun|R|Syrah, Grenache, Mourvèdre
Minervois|RBO|Syrah, Grenache, Carignan, Mourvèdre
Minervois-La Livinière|R|Syrah, Grenache, Mourvèdre
Corbières|RBO|Carignan, Grenache, Syrah
Corbières-Boutenac|R|Carignan, Grenache, Syrah
Fitou|R|Carignan, Grenache, Syrah
La Clape|RB|Syrah, Grenache, Bourboulenc
Picpoul de Pinet|B|Piquepoul
Terrasses de Béziers|R|Syrah, Grenache
Clairette du Languedoc|BD|Clairette
Clairette de Bellegarde|B|Clairette
Limoux|BR|${CH}, ${CHE}, Mauzac, Merlot
Blanquette de Limoux|E|Mauzac, ${CHE}, ${CH}
Blanquette méthode ancestrale|E|Mauzac
Crémant de Limoux|E|${CH}, ${CHE}, Mauzac
Cabardès|RO|Merlot, Syrah, Grenache, Cabernet Sauvignon
Malepère|RO|Merlot, ${CF}
Muscat de Frontignan|D|Muscat
Muscat de Mireval|D|Muscat
Muscat de Lunel|D|Muscat
Muscat de Saint-Jean-de-Minervois|D|Muscat

# Roussillon
Côtes du Roussillon|RBO|Grenache, Syrah, Carignan, Mourvèdre
Côtes du Roussillon Villages|R|Grenache, Syrah, Carignan
Côtes du Roussillon Villages Caramany|R|Grenache, Syrah, Carignan
Côtes du Roussillon Villages Latour-de-France|R|Grenache, Syrah, Carignan
Côtes du Roussillon Villages Lesquerde|R|Grenache, Syrah, Carignan
Côtes du Roussillon Villages Tautavel|R|Grenache, Syrah, Carignan
Côtes du Roussillon Les Aspres|R|Grenache, Syrah, Mourvèdre
Collioure|RBO|Grenache, Syrah, Mourvèdre
Banyuls|D|Grenache
Banyuls Grand Cru|D|Grenache
Maury|DR|Grenache
Rivesaltes|D|Grenache, Macabeu
Muscat de Rivesaltes|D|Muscat
Grand Roussillon|D|Grenache, Muscat

# Sud-Ouest
Bergerac|RBO|${BXR}, ${BXB}
Côtes de Bergerac|RBD|${BXR}, ${BXB}
Pécharmant|R|Merlot, Cabernet Sauvignon, Cabernet Franc
Monbazillac|D|${LIQ}
Saussignac|D|Sémillon, Sauvignon Blanc
Montravel|BR|${BXB}, Merlot
Côtes de Montravel|D|${LIQ}
Haut-Montravel|D|${LIQ}
Rosette|D|Sémillon, Sauvignon Blanc
Côtes de Duras|RBOD|${BXR}, ${BXB}
Côtes du Marmandais|RBO|Merlot, Cabernet Franc, Abouriou
Buzet|RBO|${BXR}
Brulhois|RO|Tannat, Merlot, Cabernet Franc
Cahors|R|Malbec, Merlot, Tannat
Coteaux du Quercy|RO|Cabernet Franc, Malbec, Merlot
Fronton|RO|Négrette
Gaillac|RBOED|Braucol, Duras, Syrah, Mauzac, Loin de l'Œil
Gaillac Premières Côtes|B|Mauzac, Loin de l'Œil
Marcillac|RO|Fer Servadou
Entraygues-Le Fel|RBO|Fer Servadou, Chenin
Estaing|RBO|Fer Servadou, Chenin
Côtes de Millau|RBO|Gamay, Syrah, Fer Servadou
Saint-Mont|RBO|Tannat, Pinenc, Gros Manseng, Arrufiac
Madiran|R|Tannat, Cabernet Franc
Pacherenc du Vic-Bilh|BD|Petit Manseng, Gros Manseng, Petit Courbu, Arrufiac
Tursan|RBO|Tannat, Baroque
Béarn|RBO|Tannat, Cabernet Franc
Jurançon|BD|Petit Manseng, Gros Manseng
Irouléguy|RBO|Tannat, Cabernet Franc, Gros Manseng
Floc de Gascogne|D|Colombard, Ugni Blanc, Gros Manseng

# Charentes
Pineau des Charentes|D|Ugni Blanc, Colombard, Merlot

# Bordeaux
Bordeaux|RBO|${BXR}, ${BXB}
Bordeaux Supérieur|RB|${BXR}
Bordeaux Clairet|O|Merlot, Cabernet Sauvignon
Crémant de Bordeaux|E|Sémillon, Cabernet Franc, Merlot
Médoc|R|${MED}
Haut-Médoc|R|${MED}
Margaux|R|${MED}
Pauillac|R|${MED}
Saint-Julien|R|${MED}
Saint-Estèphe|R|${MED}
Listrac-Médoc|R|${MED}
Moulis-en-Médoc|R|${MED}
Graves|RB|${MED}, ${BXB}
Graves Supérieures|D|${LIQ}
Pessac-Léognan|RB|${MED}, ${BXB}
Sauternes|D|${LIQ}
Barsac|D|${LIQ}
Cérons|D|${LIQ}
Loupiac|D|${LIQ}
Cadillac|D|${LIQ}
Sainte-Croix-du-Mont|D|${LIQ}
Premières Côtes de Bordeaux|D|${LIQ}
Entre-deux-Mers|B|${BXB}, Muscadelle
Graves de Vayres|RB|${BXR}, ${BXB}
Côtes de Bordeaux|R|Merlot, Cabernet Sauvignon
Cadillac Côtes de Bordeaux|R|Merlot, Cabernet Sauvignon
Castillon Côtes de Bordeaux|R|${LIB}
Blaye Côtes de Bordeaux|RB|Merlot, Cabernet Sauvignon, ${BXB}
Francs Côtes de Bordeaux|RB|${LIB}
Sainte-Foy Côtes de Bordeaux|RBD|${BXR}, ${BXB}
Blaye|R|Merlot, Cabernet Sauvignon
Côtes de Bourg|RB|Merlot, Cabernet Sauvignon, Malbec
Saint-Émilion|R|${LIB}
Saint-Émilion Grand Cru|R|${LIB}
Montagne-Saint-Émilion|R|${LIB}
Lussac-Saint-Émilion|R|${LIB}
Puisseguin-Saint-Émilion|R|${LIB}
Saint-Georges-Saint-Émilion|R|${LIB}
Pomerol|R|${LIB}
Lalande-de-Pomerol|R|${LIB}
Fronsac|R|${LIB}
Canon-Fronsac|R|${LIB}

# IGP (indications géographiques protégées) : vins de pays, fréquents chez les vignerons nature.

# Languedoc
Pays d'Oc|RBOE||IGP
Pays d'Hérault|RBO||IGP
Aude|RBO||IGP
Gard|RBO||IGP
Cévennes|RBO||IGP
Saint-Guilhem-le-Désert|RBO||IGP
Côtes de Thau|RBO||IGP
Côtes de Thongue|RBO||IGP
Coteaux d'Ensérune|RBO||IGP
Haute Vallée de l'Orb|RBO||IGP
Haute Vallée de l'Aude|RBO||IGP
Vallée du Paradis|RBO||IGP
Vicomté d'Aumelas|RBO||IGP
Cité de Carcassonne|RBO||IGP
Coteaux de Narbonne|RBO||IGP
Coteaux de Peyriac|RBO||IGP
Pays de Cessenon|RBO||IGP
Sable de Camargue|ORB||IGP

# Roussillon
Côtes Catalanes|RBO||IGP
Côte Vermeille|RBO||IGP

# Vallée du Rhône
Collines Rhodaniennes|RBO||IGP
Ardèche|RBO||IGP
Vaucluse|RBO||IGP
Drôme|RBO||IGP
Comtés Rhodaniens|RBO||IGP
Coteaux des Baronnies|RBO||IGP

# Provence
Méditerranée|RBO||IGP
Var|RBO||IGP
Bouches-du-Rhône|RBO||IGP
Alpilles|RBO||IGP
Alpes-de-Haute-Provence|RBO||IGP
Hautes-Alpes|RBO||IGP
Maures|RBO||IGP
Mont Caume|RBO||IGP
Alpes-Maritimes|RBO||IGP

# Corse
Île de Beauté|RBO||IGP

# Sud-Ouest
Côtes de Gascogne|BRO|Colombard, Ugni Blanc, Gros Manseng|IGP
Comté Tolosan|RBO||IGP
Côtes du Lot|RBO|Malbec, Merlot|IGP
Côtes du Tarn|RBO||IGP
Gers|RBO||IGP
Landes|RBO||IGP
Agenais|RBO||IGP
Périgord|RBO||IGP
Lavilledieu|RO|Négrette|IGP
Aveyron|RBO||IGP
Ariège|RBO||IGP
Pays de Brive|RBO||IGP
Corrèze|RBO||IGP
Thézac-Perricard|RO|Malbec, Merlot|IGP

# Bordeaux
Atlantique|RBO||IGP

# Charentes
Charentais|RBO||IGP

# Loire
Val de Loire|RBOE||IGP
Coteaux du Cher et de l'Arnon|RBO||IGP
Puy-de-Dôme|RBO||IGP

# Bourgogne
Coteaux de l'Auxois|RB||IGP
Côte d'Or|RB||IGP
Yonne|RB||IGP
Saône-et-Loire|RB||IGP
Coteaux de Tannay|RB||IGP
Sainte-Marie-la-Blanche|RB||IGP

# Jura
Franche-Comté|RB||IGP

# Savoie
Vin des Allobroges|RB||IGP
Isère|RBO||IGP
Coteaux de l'Ain|RBO||IGP

# Champagne
Haute-Marne|RB||IGP
Coteaux de Coiffy|RB||IGP

# Lorraine
Côtes de Meuse|RB||IGP
`;
