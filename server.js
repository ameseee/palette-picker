//bring in express - a library that is built on top of node that makes it easier for us to read, write, and maintain node
const express = require('express');
//bring in bodyParser - express was built for the bare minimum - this is required for a post to be read by the server
const bodyParser = require('body-parser');
//sets environment to development unless a node environment is declared with process.env
const environment = process.env.NODE_ENV || 'development';
//brings in the knexfile, applying the current environment
const configuration = require('./knexfile')[environment];
//instantiates a database we can work with by bringing in knex on our configuration
const database = require('knex')(configuration);
//initiates the application
const app = express();

//let program know that we need to use this as middleware, and to expect json.
app.use(bodyParser.json());
//use middleware to parse urlencodedbodies
app.use(bodyParser.urlencoded({ extended: true }));
//this the express middleware thats grabbing and serving up static assets from HTML
app.use(express.static(__dirname + '/public'));

//set the port to environment variable port; if not defined, set to 3000.
app.set('port', process.env.PORT || 3000);
//set title of application
app.locals.title = 'Palette Picker';

//this is what will be sent to browser if static HTML is not served
app.get('/', (request, response) => {
  response.send('Welcome to Palette Picker!');
});

//define endpoint to go into the DB, retreive the entire projects table
app.get('/api/v1/projects', (request, response) => {
  database('projects').select()
  //serve the projects
    .then(projects => {
      //.json is used to include headers, be more explicit, and it JSON.stringifys for us.
      //return 200 code indicating the request was fulfilled
      return response.status(200).json(projects);
    })
    .catch(error => {
      //return the error and a 500 code which indicates issue with server
      return response.status(500).json({ error });
    });
});

//create endpoint to access a specific palette from the palette table
app.get('/api/v1/palettes/:id', (request, response) => {
  //store the id of the request object
  const { id } = request.params;

  //from the palettes table, access the palette that has an id that matches the request id
  database('palettes').where('id', id).select()
    .then(palette => {
      if (palette.length) {
        //check that the palettes array has palettes in it
        //return a 200 OK code indicating request was fulfilled
        return response.status(200).json(palette);
      } else {
        //return response.status(200).json([]);???
        return response.status(404).json({
          error: `Could not find palette with id of ${id}.`
        });
      }
    })
    .catch(error => {
      //return the error and a 500 code which indicates issue with server
      return response.status(500).json({ error });
    });
});

//define endpoint to go into DB, retrieve palettes of a sepcific project
app.get('/api/v1/projects/:id/palettes', (request, response) => {
  //store id from endpoint request
  const projectId = request.params.id;

  //go into DB, access the palettes table, find the palettes that have a project_id that matches the projectId stored above. select it.
  database('palettes').where('project_id', projectId).select()
    .then(palettes => {
      //check that the palette exists
      if (palettes.length) {
        //if it does, return an OK status code and the palettes
        return response.status(200).json(palettes);
      } else {
        //if the palette doesn't exist, send a 404 code to indicate it doesn't exist
        return response.status(404).json({
          error:
          `Could not find any palletes with for project id: ${projectId}.`
        });
      }
    })
    .catch(error => {
    //return the error and a 500 code which indicates issue with server
      return response.status(500).json({ error });
    });
});

//creates an endpoint to add a project
app.post('/api/v1/projects', (request, response) => {
  // store the request body, which will be an object
  const project = request.body;

//loop over all required parameters
  for (let requiredParameter of ['project_name']) {
    //if the project does not have the parameter currently being looped over --
    if (!project[requiredParameter]) {
      //send 422 error (unprocessable entity) indicating that the syntax was correct, but was unable to process
      return response.status(422).json({
        //provides a clear and helpful error message
        error: `You are missing the ${requiredParameter} property.`
      });
    }
  }

  //add a projet to our DB, and returning the id (second parameter)
  database('projects').insert(project, 'id')
    .then(projectId => {
      //send 201 code indicating the request has been fulfilled, return the unique id for created project. knex serves in an array which is why [0] was accessed
      return response.status(201).json({ id: projectId[0] });
    })
    .catch(error => {
      //return the error and a 500 code which indicates issue with server
      return response.status(500).json({ error });
    });
});

//create an endpoint to access palettes that belong to a specific project
app.post('/api/v1/projects/:id/palettes', (request, response) => {
  //store pallete and projectId from teh request
  let palette = request.body;
  const projectId = request.params.id;

  //loop through all required parameters
  for (let requiredParameter of [
    'palette_title',
    'color_1',
    'color_2',
    'color_3',
    'color_4',
    'color_5',
    'project_id']) {
    //check the request does not contain the required parameter, then --
    if (!palette[requiredParameter]) {
      //return a 422 code, indicating that the syntax was correct, but was unable to process
      return response.status(422).json({
        //send a detailed message so it is helpful!
        error: `You are missing the ${requiredParameter} property.`
      });
    }
  }

  //reassign the value of the palette variable with a new object, bringing the project id in with the palette object
  palette = Object.assign({}, palette, { project_id: projectId });

  //find the palettes table and add a palette, then return the palette id (send parameter)
  database('palettes').insert(palette, 'id')
    .then(palette => {
      //return a 201, response fulfilled, code
      return response.status(201).json({ id: palette[0] });
    })
    .catch(error => {
      //return the error and a 500 code which indicates issue with server
      return response.status(500).json({ error });
    });

});

//create an endpoint to access specific palettes. delete method will destroy
app.delete('/api/v1/palettes/:id', (request, response) => {
  //destructure to access and store id from the request object
  const { id } = request.params;

  //go into palettes table in DB and find the id that matches the request id, destroy that palette
  database('palettes').where({ id }).del()
    .then(palette => {
      //check that a palette does exist
      if (palette) {
        //return a  204 code indiciating that request is fulfilled and there is no content to send back
        return response.sendStatus(204);
      } else {
        //if the 'palette' in question doesn't actually exist
        //send a 422 indiciating request syntax was accurate, but unable to process
        return response.status(422).json({ error: 'Not Found' });
      }
    })
    .catch(error => {
      //return the error and a 500 code which indicates issue with server
      return response.status(500).json({ error });
    });

});

//this tells app to listen to a specified port
app.listen(app.get('port'), () => {
  //log to let us know app is running
  console.log(`${app.locals.title} is running on ${app.get('port')}.`);
});

//need to export so the testing file can bring it in
module.exports = app;
