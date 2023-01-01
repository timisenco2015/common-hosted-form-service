const routes = require('express').Router();

const controller = require('./controller');


routes.get('/formiocomponentsgrouping', async (req, res, next) => {
  await controller.getFormioComponentsCount(req, res, next);
});



module.exports = routes;
