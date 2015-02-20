Object.assign = Object.assign || require("react/lib/Object.assign.js");

var Reflux    = require("reflux");
var Lazy      = require("lazy.js");

Reflux = Object.assign(
  /*  This is the constructor Reflux should have (but doesn't yet).
   *
   *  It takes a list of definitions:
   *
   *      var reflux = new Reflux(
   *        {
   *          "FirstThing":   {
   *                            "actions":  [
   *                                          "loadFirstThing"
   *                                        ],
   *
   *                            "store":    {
   *                                          "onLoadFirstThing":  function () {
   *                                        …
   *                          },
   *
   *          "SecondThing":  {
   *                            …
   *                          },
   *        }
   *      );
   *
   *  and returns a data structure:
   *
   *      reflux.actions.loadFirstThing
   *      reflux.stores.FirstThing
   *      reflux.stores.SecondThing
   *
   *  `actions` are automatically listened to by the store that defines them.  To make
   *  sure stores can effectively listen to each other, creation happens in two passes:
   *
   *   - The first pass transforms the definitions into Stores, binding the appropriate
   *     methods.
   *
   *   - The second pass calls each definition's `init` method and listens to the
   *     actions enumerated in the definition.
   *
   *  Breaking it up into two passes makes the constructor incredibly simple because we
   *  don't have to worry about dependency order - none of the actions or stores can be
   *  depended on until after they've all been created.
   */


  function (definitions) {
    this.actions = Lazy({});
    this.stores  = {};

    Lazy(definitions).each(
      (definition, name) => {
        if (definition.actions) {
          this.actions = this.actions.assign(
            Reflux.createActions(definition.actions)
          );
        }

        console.assert(definition.store, "A Reflux definition must contain a `store`.");

        this.stores[name] = Reflux.createStore(
          Lazy(definition.store).omit(["init", "listenables"]).toObject()
        );
      }
    );

    this.actions = this.actions.toObject();

    Lazy(this.stores).each(
      (store, name) => {
        var definition = definitions[name];

        if (definition.dependencies) {
          Lazy(definition.dependencies.stores).each(
            dependencyName => console.assert(this.stores[dependencyName], `${ name } depends on the store ${ dependencyName }, but that isn't defined.`)
          );

          Lazy(definition.dependencies.actions).each(
            dependencyName => console.assert(this.actions[dependencyName], `${ name } depends on the action ${ dependencyName }, but that isn't defined.`)
          );
        }


        store.parent = this;

        store.init = definition.store.init;

        store.listenables = Lazy(definition.actions).map(
          actionName => [actionName, this.actions[actionName]]
        ).toObject();

        if (store.init)
          store.init();

        if (store.listenables)
          store.listenToMany(store.listenables);

        store.hydrate   = store.hydrate   || (value => value);
        store.dehydrate = store.dehydrate || (value => value);
      }
    );
  },

  Reflux
);

Reflux.prototype.hydrate = function (dehydrated) {
  Lazy(dehydrated).each(
    (state, name) => {
      if (this.stores[name]) {
        this.stores[name].state = this.stores[name].hydrate(state);

      } else {
        console.warn(`reflux.hydrate couldn't find a matching store for ${ name }`);
      }
    }
  );
};

Reflux.prototype.dehydrate = function () {
  return Lazy(this.stores).map(
    (store, name) => [name, store.dehydrate(store.state)]
  ).toObject();
};

module.exports = Reflux;
