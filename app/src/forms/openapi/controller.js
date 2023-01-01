const service = require('./service');

module.exports = {
  getFormioComponentsCount: async (req, res, next) => {
    try {
      const response = await service.eachFormioComponentsCount();
      res.status(200).json(Object.fromEntries(response));
    } catch (error) {
      next(error);
    }
  },


};
