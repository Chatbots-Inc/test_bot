// import  basic modules
const functions = require('firebase-functions');
const {
 dialogflow,
 SimpleResponse,
 BasicCard,
 Button,
 Image,
 List,
 Suggestions,
} = require('actions-on-google');

// firebase real time database
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chatbotsi-intets-especificos.firebaseio.com"
});
var db = admin.database();

// declare dialoglow conversation handler
const app = dialogflow({
    debug: true,
    clientId: '65708101491-d7h7cvrsgdeea5oc1bvl1mmd6s36flh4.apps.googleusercontent.com'
});

// convenient intent suggestions
const actionSuggestions = [
    'Definición',
    'Tutorial',
    'Video',
    'Algoritmo'
];

const conceptSuggestions = [
    'BFS',
    'DFS',
    'Greedy',
    'UCS',
    'A*',
    'Alpinista'
];

const err_catch = "Lo siento, no te puedo ayudar con eso :C";
const def_lifespan = 2;

// this belongs to the database
const db_available_actions = db.ref('props/list_of_available_actions/');
const db_concepts_list = db.ref('props/list_of_concepts/');
const db_concepts_content = db.ref('contenido/conceptos/');

//////////////////////// INTENTS ////////////////////////////////////////////

// INTENT: just say hi and show intent suggestions
app.intent('Default Welcome Intent', (conv) => {
    conv.contexts.set('action_context', 10, {'action': ""});
    conv.contexts.set('concept_context', 10, {'concept': ""});
    conv.ask(new SimpleResponse({
        speech: '¡Hola!',
        text: '¡Hola! Soy el chatbot de sistemas inteligentes, hazme alguna pregunta o simplemente pregúntame qué puedo hacer'
    }));
    conv.ask(new Suggestions(['¿Qué puedes hacer?', '¿Qué es dfs?', 'Algoritmo de a estrella']));
});

// INTENT: directly delivers the algorithm of a concept
app.intent('action_algorithm_direct', (conv, {concept}) => {
  // set action context
  conv.contexts.set('action_context', def_lifespan, {'action': 'CONCEPT_ALGORITHM'});
  let response = '';
  // set concept context
  conv.contexts.set('concept_context', def_lifespan, {'concept': concept});
  return db_concepts_content.once('value')
    .then(result => {
        if (concept) {
            let algorithm = result.val()[concept]['descripcion_algoritmo'];
            let concept_lwr = concept.toLowerCase();
            if (algorithm) {
                response = algorithm;
                conv.ask(`Este es el algoritmo de ${concept_lwr}:`);
            } else {
                conv.ask(`Lo siento, no conozco el algoritmo de ${concept_lwr}`);
            }
            conv.ask(new BasicCard({
                text: response,
                title: concept,
                image: new Image({
                    url: result.val()[concept]['algoritmo'],
                    alt: 'Imagen del algoritmo'
                })
            }));
            return conv.ask(new Suggestions(actionSuggestions));
        } else {
            conv.ask('Lo siento, no conozco ese algoritmo, pero te puedo sugerir algunos que sí...');
            return conv.ask(new Suggestions(conceptSuggestions));
        }
    }).catch(err => {
        console.error(err);
        return conv.close(err_catch);
    });
});

// INTENT: directly delivers the definition of a concept
app.intent('action_definition_direct', (conv, {concept}) => {
  // set action context
  conv.contexts.set('action_context', def_lifespan, {'action': 'CONCEPT_DEFINITION'});
  let response = '';
  // set concept context
  conv.contexts.set('concept_context', def_lifespan, {'concept': concept});
  return db_concepts_content.once('value')
    .then(result => {
        if (concept) {
            let definition = result.val()[concept]['definicion'];
            let concept_lwr = concept.toLowerCase();
            if (definition) {
                response = definition;
                conv.ask(`Esta es la definición de ${concept_lwr}:`);
            } else {
                conv.ask(`Lo siento, no conozco la definición de ${concept_lwr}`);
            }
            conv.ask(new BasicCard({
                text: response,
                title: concept,
                image: new Image({
                    url: result.val()[concept]['imagen'],
                    alt: 'Imagen del concepto'
                })
            }));
            return conv.ask(new Suggestions(actionSuggestions));
        } else {
            conv.ask('Lo siento, no conozco esa definición, pero te puedo sugerir algunas que sí...');
            return conv.ask(new Suggestions(conceptSuggestions));
        }
    }).catch(err => {
        console.error(err);
        return conv.close(err_catch);
    });
});

// INTENT: directly starts the tutorial of a concept also mentioned by user
app.intent('action_tutorial_direct', (conv, {concept}) => {
  // set action context
  conv.contexts.set('action_context', def_lifespan, {'action': 'CONCEPT_TUTORIAL'});
  // set concept context
  conv.contexts.set('concept_context', def_lifespan, {'concept': concept});
  // go fetch its tutorial
  switch (concept) {
    case 'Busqueda A*':
        conv.followup('EVENT_ASTAR');
        break;
    case 'Busqueda de Alpinista':
        conv.followup('EVENT_ALPS');
        break;
    case 'Busqueda costo uniforme':
        conv.followup('EVENT_NUCS');
        break;
    case 'Busqueda en anchura':
        conv.followup('EVENT_BFS');
        break;
    case 'Busqueda Greedy':
        conv.followup('EVENT_GREEDY');
        break;
    case 'Busqueda en profundidad':
        conv.followup('EVENT_DFS');
        break;
    default:
        conv.ask('Lo siento, no tengo el tutorial de ese concepto, pero te puedo sugerir algunos que sí...');
        conv.ask(new Suggestions(conceptSuggestions));
  }
});

// INTENT: direct video
///////here

// INTENT: display a list of available actions
app.intent('actions_available', (conv) => {
  let response = 'Esta es una lista de las acciones que puedo realizar:';
  conv.ask(new SimpleResponse({
      speech: response,
      text: response
  }));
  // Read list format from reference to the database
  return db_available_actions.once('value')
      .then(result => {
          // create new list with the result promise object
          return conv.ask(new List(result.val()));
      }).catch(err => {
          console.error(err);
          return conv.close(err_catch);
      });
});

// INTENT: handle option selected from 'actions_available'
app.intent('actions.intent.OPTION', (conv, params, option) => {
  // Get the user's selection
  // Compare the user's selections to each of the item's keys
  let response;
  if (!option) {
    response = 'No seleccionaste ninguna opción';
  } else if (option === 'DEFINITION') {
    conv.followup('EVENT_DEFINITION');
  } else if (option === 'TUTORIAL') {
    conv.followup('EVENT_TUTORIAL');
  } else if (option === 'VIDEO') {
    conv.followup('EVENT_VIDEO');
  } else if (option === 'ALGORITHM') {
    conv.followup('EVENT_ALGORITHM');
  } else {
  // I am assuming the option selected was a concept
    response = 'No se identificó el concepto o la acción.';
    conv.contexts.set('concept_context', def_lifespan, {'concept': option});
    let ACTION = conv.contexts.get('action_context').parameters['action'];
    conv.followup('EVENT_' + ACTION);
  }
  conv.ask(new SimpleResponse({
      speech: response,
      text: response
  }));
});

// INTENT: display a list 5 sample terms that have definition
app.intent('new_definition', (conv) => {
    // set action context
    conv.contexts.set('action_context', def_lifespan, {'action': 'CONCEPT_DEFINITION'});
    // simple response
    let response = 'Esta es una lista de términos que puedo definir.';
    conv.ask(new SimpleResponse({
        speech: response,
        text: response
    }));
    // Read list format from reference to the database
    return db_concepts_list.once('value')
        .then(result => {
            // create new list with the result promise object
            return conv.ask(new List(result.val()));
        }).catch(err => {
            console.error(err);
            return conv.close(err_catch);
        });
});

// INTENT: define concept
app.intent('new_definition - get_concept', (conv, {concept}) => {
    // set concept context
    conv.contexts.set('concept_context', def_lifespan, {'concept': concept});
    // go fetch its definition
    return db_concepts_content.once('value')
    .then(result => {
        if (concept) {
            let definition = result.val()[concept]['definicion'];
            let concept_lwr = concept.toLowerCase();
            if (definition) {
                response = definition;
                conv.ask(new SimpleResponse({
                    speech: `Esta es la definición de ${concept_lwr}:`,
                    text: `Esta es la definición de ${concept_lwr}:`
                }));
            } else {
                conv.ask(`Lo siento, no conozco la definición de ${concept_lwr}`);
            }
            conv.ask(new BasicCard({
                text: response,
                title: concept,
                image: new Image({
                    url: result.val()[concept]['imagen'],
                    alt: 'Imagen del concepto'
                })
            }));
            return conv.ask(new Suggestions(actionSuggestions));
        } else {
            conv.ask('Lo siento, no conozco esa definición, pero te puedo sugerir algunas que sí...');
            return conv.ask(new Suggestions(conceptSuggestions));
        }
    }).catch(err => {
        console.error(err);
        return conv.close(err_catch);
    });
});

// INTENT: display concepts that have a tutorial available
app.intent('new_tutorial', (conv) => {
    // En el futuro sugerir tutoriales populares a través de un carrusel
    // set action context
    conv.contexts.set('action_context', def_lifespan, {'action': 'CONCEPT_TUTORIAL'});
    // simple response
    let response = 'Estos son los tutoriales disponibles.';
    conv.ask(new SimpleResponse({
        speech: response,
        text: response
    }));
    // Read list format from reference to the database
    return db_concepts_list.once('value')
        .then(result => {
            // create new list with the result promise object
            return conv.ask(new List(result.val()));
        }).catch(err => {
            console.error(err);
            return conv.close(err_catch);
        });
});

// INTENT: show concept tutorial
app.intent('new_tutorial - get_concept', (conv, {concept}) => {
    // set concept context
    conv.contexts.set('concept_context', def_lifespan, {'concept': concept});
    // go fetch its tutorial
    switch (concept) {
        case 'Busqueda A*':
            conv.followup('EVENT_ASTAR');
            break;
        case 'Busqueda de Alpinista':
            conv.followup('EVENT_ALPS');
            break;
        case 'Busqueda costo uniforme':
            conv.followup('EVENT_NUCS');
            break;
        case 'Busqueda en anchura':
            conv.followup('EVENT_BFS');
            break;
        case 'Busqueda Greedy':
            conv.followup('EVENT_GREEDY');
            break;
        case 'Busqueda en profundidad':
            conv.followup('EVENT_DFS');
            break;
        default:
            conv.ask('Lo siento, no tengo el tutorial de ese concepto, pero te puedo sugerir algunos que sí...');
            conv.ask(new Suggestions(conceptSuggestions));
    }
});

// INTENT: show concepts with videos
app.intent('new_video', (conv) => {
    // Estos son los videos más populares (incluir media response)...
    // set action context
    conv.contexts.set('action_context', def_lifespan, {'action': 'CONCEPT_VIDEO'});
    // simple response
    let response = 'Esta es una lista de los términos que tienen un video.';
    conv.ask(new SimpleResponse({
        speech: response,
        text: response
    }));
    // Read list format from reference to the database
    return db_concepts_list.once('value')
        .then(result => {
            // create new list with the result promise object
            return conv.ask(new List(result.val()));
        }).catch(err => {
            console.error(err);
            return conv.close(err_catch);
        });
});

// INTENT: video of concept
app.intent('new_video - get_concept', (conv, {concept}) => {
    // set concept context
    conv.contexts.set('concept_context', def_lifespan, {'concept': concept});
    // go fetch its video
    return db_concepts_content.once('value')
      .then(result => {
        if (concept) {
            let video = result.val()[concept]['video'];
            let concept_lwr = concept.toLowerCase();
            if (video) {
                response = video;
                conv.ask(new SimpleResponse({
                    speech: `Este es el video de ${concept_lwr}:`,
                    text: `Este es el video de ${concept_lwr}:`
                }));
            } else {
                conv.ask(`Lo siento, no tengo el video de ${concept_lwr}`);
            }
            conv.ask(new BasicCard({
                title: concept,
                buttons: new Button({
                    title: 'Ver en Youtube',
                    url: response
                }),
                image: new Image({
                    url: result.val()[concept]['imagen'],
                    alt: 'Imagen del concepto'
                })
            }));
            return conv.ask(new Suggestions(actionSuggestions));
        } else {
            conv.ask('Lo siento, no tengo ese video, pero te puedo sugerir algunos que sí...');
            return conv.ask(new Suggestions(conceptSuggestions));
        }
    }).catch(err => {
        console.error(err);
        return conv.close(err_catch);
    });
});

// INTENT: show concepts with available algorithms
app.intent('new_algorithm', (conv) => {
    // Mostrando sugerencias de algoritmos populares
    // set action context
    conv.contexts.set('action_context', def_lifespan, {'action': 'CONCEPT_ALGORITHM'});
    // simple response
    let response = 'Esta es una lista de los algoritmos que puedo mostrarte.';
    conv.ask(new SimpleResponse({
        speech: response,
        text: response
    }));
    // Read list format from reference to the database
    return db_concepts_list.once('value')
        .then(result => {
            // create new list with the result promise object
            return conv.ask(new List(result.val()));
        }).catch(err => {
            console.error(err);
            return conv.close(err_catch);
        });
});

// INTENT: give algorithm from context instead of extracting parameter
app.intent('new_algorithm - get_concept', (conv, {concept}) => {
    let response = '';
    // set concept context
    conv.contexts.set('concept_context', def_lifespan, {'concept': concept});
    // go fetch its definition
    return db_concepts_content.once('value')
    .then(result => {
        if (concept) {
            let algorithm = result.val()[concept]['descripcion_algoritmo'];
            let concept_lwr = concept.toLowerCase();
            if (algorithm) {
                response = algorithm;
                conv.ask(new SimpleResponse({
                    speech: `Este es el algoritmo de ${concept_lwr}:`,
                    text: `Este es el algoritmo de ${concept_lwr}:`
                }));
            } else {
                conv.ask(`Lo siento, no conozco el algoritmo de ${concept_lwr}`);
            }
            conv.ask(new BasicCard({
                text: response,
                title: concept,
                image: new Image({
                    url: result.val()[concept]['algoritmo'],
                    alt: 'Imagen del algoritmo'
                })
            }));
            return conv.ask(new Suggestions(actionSuggestions));
        } else {
            conv.ask('Lo siento no, conozco ese algoritmo, pero te puedo sugerir algunos que sí...');
            return conv.ask(new Suggestions(conceptSuggestions));
        }
    }).catch(err => {
        console.error(err);
        return conv.close(err_catch);
    });
});

///////////////////////// EXPORT APP ///////////////////////////////////

exports.fulfillment = functions.https.onRequest(app);
