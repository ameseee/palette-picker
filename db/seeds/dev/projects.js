/*eslint-disable no-console*/
exports.seed = function(knex, Promise) {
  return knex('palettes').del()
    .then(() => knex('projects').del())
    .then(() => {
      return Promise.all([
        knex('projects').insert({
          project_name: 'Example Project'
        }, 'id')
          .then(project => {
            return knex('palettes').insert([
              { palette_title: 'Cool Sunset',
                color_1: '#01084f',
                color_2: '#391954',
                color_3: '#631e50',
                color_4: '#a73c5a',
                color_5: '#ff7954',
                project_id: project[0] },
              { palette_title: 'Summer Ice',
                color_1: '#f4a644',
                color_2: '#f9914b',
                color_3: '#f47b52',
                color_4: '#f25e5e',
                color_5: '#f64863',
                project_id: project[0] },
            ]);
          })
          .then(() => console.log('seeding complete!'))
          .catch(error => console.log({ error }))
      ]);
    })
    .catch(error => console.log({ error }));
};
