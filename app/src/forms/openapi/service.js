const {FormVersionDraft } = require('../common/models');
const { groupFormioComponents } = require('../common/utils');

const service = {

  eachFormioComponentsCount:async(query)=>{
    const allForms = await FormVersionDraft.query();
    let chartData =[];
    let result = new Promise(function (resolve) {
      const componentTrackerCount = new Map();
      for(let form of allForms) {
        groupFormioComponents(form.schema.components, componentTrackerCount);
      }
     resolve(componentTrackerCount);
    })
   return result;
  },

};

module.exports = service;
