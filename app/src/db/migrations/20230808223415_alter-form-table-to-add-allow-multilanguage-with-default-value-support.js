exports.up = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.jsonb('allowMultilanguageSupport').notNullable().defaultTo({}).comment('Form level Multilanguage settings.');
    })
  );
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.alterTable('form', (table) => {
      table.dropColumn('allowMultilanguageSupport');
    })
  );
};
