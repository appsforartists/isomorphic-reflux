Object.assign = Object.assign || require("react/lib/Object.assign.js");

var Reflux    = require("reflux");
var Lazy      = require("lazy.js");

module.exports = Object.assign(
  function (definitions) {
    var reflux = {
      "actions":  {},
      "stores":   {}
    };

    reflux.stores = Lazy(definitions).map(
      (definition, name) => {
        var actionNames = Lazy(definition.actions).without(Object.keys(reflux.actions)).toArray();

        var actions = Reflux.createActions(actionNames);

        reflux.actions = Object.assign(
          actions,

          reflux.actions
        );

        return [
          name,

          Reflux.createStore(
            Object.assign(
              {                 // Look up actions on reflux (rather than locally)
                                // in case some are shared between many states.
                "listenables":  Lazy(definition.actions).map(
                                  actionName => [actionName, reflux.actions[actionName]]
                                ).toObject(),

                // // it would be really cool to add a `then` method here
                // // so the store could be wrapped in Promise.resolve to get
                // // its first value, and then stop listening automatically
                // //
                // // Alternatively, maybe the actions can be thenable, resolved
                // // when the store(s) that are listening trigger.
                // // This could be tricky when you have chained stores.

                //
                // // other wrinkles: how do you handle loading new data?  if a
                // // store sets its state to null while it waits for data, you
                // // need to make sure the server doesn't return prematurely

                // "then":         function (callback) {
                //                   var resolve = (...results) => {
                //                     this.stopListeningTo(

                //                     callback.apply(
                //                   };

                //                   this.listen(resolve);
                //                 }
              },
              definition.store
            )
          )
        ];
      }
    ).toObject();

    return reflux;
  },

  Reflux
);
