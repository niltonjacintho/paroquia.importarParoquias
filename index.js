const fs = require('firebase-admin');
const serviceAccount = require('./keys/key.json');

fs.initializeApp({
    credential: fs.credential.cert(serviceAccount)
});

const db = fs.firestore();

var request = require('request');
var pagina = 4;
var existePagina = true;
var paroquias = []
var p = {}
var collectionName = 'paroquias'
var html = '';
var htmlDetalhes = '';
//getData();
main();

async function getData() {
    try {
        const query = db.collection(collectionName); // Replace with your collection name
        const querySnapshot = await query.get();
        const documents = querySnapshot.docs.map((doc) => doc.data()); // Extract document data
        // console.log('Documents in category:', category);
        //console.log(documents);
    } catch (error) {
        console.error('Error retrieving documents:', error);
    }
}

async function limparParoquias() {
    try {
        const collectionRef = db.collection(collectionName);
        let deleteCount = 0; // Track deleted documents

        // Create a query to iterate through documents
        let query = collectionRef.limit(10); // Limit documents per batch

        // Loop to delete documents in batches
        while (query) {
            const snapshot = await query.get();

            // Check if any documents were found
            if (snapshot.size === 0) {
                console.log('No more documents to delete.');
                break;
            }

            // Delete documents in the current batch
            const batch = db.batch();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();

            deleteCount += snapshot.size; // Update deleted document count
            console.log('Deleted', deleteCount, 'documents so far.');

            // Update query for the next batch (if documents remain)
            query = query.startAfter(snapshot.docs[snapshot.docs.length - 1]);
        }

    } catch (error) {
        console.error('Error deleting documents:', error);
    }
};

async function addParoquia(data, collectionName) {
    try {
        const collectionRef = db.collection(collectionName);
        const docRef = collectionRef.doc(); // Generate a unique document ID

        await docRef.set(data); // Set the data on the newly created document
        //console.log('Data added to collection:', collectionName);
    } catch (error) {
        console.error('Error adding data:', error);
    }
};


async function main() {
    console.log('excluindo')
    await limparParoquias()
    console.log('banco limpo')
    await getPagina(pagina).then(function (data) { this.html = data; });
    while (existePagina) {
        var existeItem = true;
        while (existeItem) {
            var currentId = getCurrentId();
            var currentName = getObjParoquia();
            limparHtml();
            console.log(currentName, currentId);
            await getPaginaDetalhes(currentId).then(function (data) { this.htmlDetalhes = data; });
            // if (currentId == 2 | true) {
            await getBaseParoquia();
            await getCapelas();
            await getPadres();
            // }
            p.currentId = currentId;
            p.currentName = currentName;
            //console.log('testando paroco ', p.padres[0], p.padres[0] != undefined)
            p.paroco = p.padres[0] != undefined ? p.padres[0] : '';
            p.vigario = p.padres[1] != undefined ? p.padres[1] : '';

            p.latitude = p.capelas[0].latitude != undefined ? p.capelas[0].latitude.replace("'", "").replace("'", "") : '';
            p.longitude = p.capelas[0].longitude != undefined ? p.capelas[0].longitude.replace("'", "").replace("'", "") : '';

            //p.telefones = 
            paroquias.push(p);
            if (currentId == 141) {
                console.log('pausa aqui');
                console.log(p)
            }
            existeItem = this.html.indexOf('"recuperaDetalhes(') != -1
            // console.log(p)
            if (currentId == 141)
                await addParoquia(p, collectionName)
            p = {}
        }

        pagina++;
        console.log(pagina)
        await getPagina(pagina).then(function (data) { this.html = data; });
        existePagina = this.html.indexOf('Clique para exibir/ocultar os detalhes da paróquia') != -1;
        // existePagina = false;
    }
    // console.log('QUANTIDADE DE PAROQUIAS ', paroquias.length)
}

function limparHtml() {
    this.html = this.html.substring(this.html.indexOf("recuperaDetalhes('panel-body") + 41);
}

function getCurrentId() {
    const html = this.html.substring(this.html.indexOf('"recuperaDetalhes('));
    const id = parseInt(html.substring(0, html.indexOf("')") + 1).split(',')[1].replace("'", ""));
    if (id == 141) {
        console.log('=====>', id, html, this.html)
    }
    return id;
}

function getObjParoquia() {
    var html = this.html.substring(this.html.indexOf('"recuperaDetalhes('));
    html = html.substring(html.indexOf('"lista-link">') + 13);
    return html.substring(0, html.indexOf("</a>")).trim();
}

async function getPagina(pagina) {
    var resultado = 'nada';
    return new Promise(async (resolve, reject) => {
        await request({
            url: 'https://www.arqrio.com.br/curia/paroquias.php?pagina=' + pagina, //URL to hit
            method: 'GET',
            headers: {
                'Content-Type': 'MyContentType',
                'Custom-Header': 'Custom Value'
            },
        }, function (error, response, body) {
            if (error) {
                resultado = error;
                reject(error);
            } else {
                resultado = body;
                resolve(body)
            }
        });
    })
}

async function getPaginaDetalhes(id) {
    // var resultado = 'nada';
    return new Promise(async (resolve, reject) => {
        await request({
            url: 'https://www.arqrio.com.br/curia/ajaxParoquiasRecuperarDetalhes.php?id=' + id, //URL to hit
            method: 'GET',
            headers: {
                'Content-Type': 'MyContentType',
                'Custom-Header': 'Custom Value'
            },
        }, function (error, response, body) {
            if (error) {
                resultado = error;
                reject(error);
            } else {
                resultado = body;
                resolve(body)
            }
        });
    })
}

function getCapelas() {
    p.capelas = [];
    let html = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('Locais de culto'));
    html = html.substring(html.indexOf('<ul>'));
    html.split('<li>').forEach(element => {
        if (element.trim().length > 10) {
            capela = {};
            if (element.length > 2) {
                capela.nome = element.substring(0, element.indexOf('<')).replace('&nbsp;', '').trim();
                if (element.indexOf('exibirMapa') != -1) {
                    htmlLat = element.substring(element.indexOf('exibirMapa') + 11, element.indexOf('DIVMAP') - 3).split(',')
                    try {
                        capela.latitude = htmlLat[0];
                        capela.longitude = htmlLat[1];
                    } catch (error) {
                        capela.latitude = '';
                        capela.longitude = '';
                    }
                } else {
                    capela.latitude = '';
                    capela.longitude = '';
                }

                let htmlEnd = element.substring(element.indexOf('<div '));
                //htmlEnd =  element.substring(element.indexOf('<div>') );
                htmlEnd = htmlEnd.substring(htmlEnd.indexOf('br/>') + 4, htmlEnd.indexOf('</li'));
                arrayEndereco = htmlEnd.split('<br>')
                capela.endereco = arrayEndereco[0] != undefined ? arrayEndereco[0].replaceAll('  ', ' ') : '';
                capela.endereco2 = arrayEndereco[1] != undefined ? arrayEndereco[1].replaceAll('  ', ' ') : '';
                capela.email = arrayEndereco[2] != undefined ? arrayEndereco[2].replaceAll('  ', ' ') : '';
                capela.telefones = arrayEndereco[3] != undefined ? arrayEndereco[3].replaceAll('  ', ' ') : '';
                p.capelas.push(capela)
            }
        }
    })
    return '';
}

function getPadres() {
    p.padres = [];
    const html = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<ul>') + 4, this.htmlDetalhes.indexOf('</ul>') - 4);
    // console.log(html)
    // console.log(html.split('<li>')[0])

    html.split('<li>').forEach(element => {
        // console.log('padre => ', element)
        if (element.trim().length > 2) {
            p.padres.push(element.replace('</li>', ''))
        }
    })
    //console.log('PADRES NMONTADOS ', p.padres)
    return html.substring(0, html.indexOf("</a>")).trim();
}

function getBaseParoquia() {

    p.nome = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<b>') + 3, this.htmlDetalhes.indexOf('</b>'));
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('</b>'));
    p.forania = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<br>') + 4, this.htmlDetalhes.indexOf('<br>Data')).trim();
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<br>Data'));
    p.nascimento = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf(':') + 1, this.htmlDetalhes.indexOf('<br><br')).trim();
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<br><br>') + 8);
    p.endereco2 = this.htmlDetalhes.substring(0, this.htmlDetalhes.indexOf('<br>')).trim();
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<br>') + 4);
    p.endereco = this.htmlDetalhes.substring(0, this.htmlDetalhes.indexOf('<br>')).trim();
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<br>') + 4);
    p.endereco += ' - CEP:' + this.htmlDetalhes.substring(0, this.htmlDetalhes.indexOf('<br>')).trim();
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<br>') + 4);
    p.telefones = this.htmlDetalhes.substring(0, this.htmlDetalhes.indexOf('<br>')).replace('Telefones:', '').trim();
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('<br>') + 4);
    p.email = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf(':') + 1, this.htmlDetalhes.indexOf('</p>')).trim();
    this.htmlDetalhes = this.htmlDetalhes.substring(this.htmlDetalhes.indexOf('</p>') + 4);
}

