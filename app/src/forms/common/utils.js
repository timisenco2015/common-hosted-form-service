const falsey = require('falsey');

const setupMount = (type, app, routes, dataErrors) => {
  const p = `/${type}`;
  app.use(p, routes);
  app.use(dataErrors);
  return p;
};

const typeUtils = {
  isInt: x => {
    if (isNaN(x)) {
      return false;
    }
    const num = parseFloat(x);
    // use modulus to determine if it is an int
    return num % 1 === 0;
  },
  isString: x => {
    return Object.prototype.toString.call(x) === '[object String]';
  },
  isBoolean: x => {
    return Object.prototype.toString.call(x) === '[object Boolean]';
  },
  isNil: x => {
    return x == null;
  }
};

const queryUtils = {
  defaultActiveOnly: params => {
    if (!params) {
      params = {};
    }
    let active = true;
    if (!typeUtils.isNil(params.active)) {
      // if caller hasn't explicitly set active, then force to active = true, do not return "deleted" forms.
      active = !falsey(params.active);
    }
    params.active = active;
    return params;
  }
};


const groupFormioComponents = (components, componentTrackerCount) => {
  if (!components) return;

  components.forEach(function(component, index) {

    if (!component) return;

    if(component.type) {
      componentTrackerCount.set(component.type, componentTrackerCount.get(component.type) + 1 || 1);
    }

    if (component.hasOwnProperty('columns') && Array.isArray(component.columns)) {
      component.columns.forEach(function(column, index) {
        groupFormioComponents(column.components,componentTrackerCount);
      });
    }

    if (component.hasOwnProperty('rows') && Array.isArray(component.rows)) {
      component.rows.forEach(function(row, index) {
        row.forEach(function(column, index) {
          groupFormioComponents(column.components, );
        });
      });
    }

    if (component.hasOwnProperty('components') && Array.isArray(component.components)) {
      groupFormioComponents(component.components, componentTrackerCount);
    }

  });
}


module.exports = {
  falsey,
  groupFormioComponents,
  setupMount,
  queryUtils,
  typeUtils,
};
