# aurelia-rxjs

An Aurelia plugin that allows you to bind to Rx Observables and Rx Subjects or use them as Binding Signals.

## How to install this plugin?

1. In your project install the plugin and `aurelia-binding-functions` via `jspm` with following command

  ```shell
  jspm install npm:aurelia-rxjs npm:aurelia-binding-functions
  ```
2. Make Aurelia load the plugin by adding the following line to the `configure` function in the `main.js` file of your `src` folder

  ```diff
    export function configure(aurelia) {
      aurelia.use
        .standardConfiguration()
        .developmentLogging();

  +   aurelia.use.plugin('aurelia-binding-functions');
  +   aurelia.use.plugin('aurelia-rxjs');

      aurelia.start().then(a => a.setRoot());
    }
  ```
3. If you use TypeScript or use Visual Studio Code the type declarations for `aurelia-rxjs` should be visible automatically. 

## Using the plugin (example)

View:

```html
<input value.bind="rx(twoWayBinding)" autofocus>
<h2>${rx(twoWayBinding)}</h2>
<button click.delegate="rx(onClick)"></button>
<h2>${random & observableSignal: twoWayBinding}</h2>
```

ViewModel:

```js
import {Observable, Subject, ReplaySubject} from 'rxjs/Rx'
import {computedFrom} from 'aurelia-framework'

export class ObservableExample {
  observable = Observable.interval(1000)
  twoWayBinding = new ReplaySubject(1)
  onClick = new Subject()

  constructor() {
    this.onClick.subscribe(next => console.log('clicked!'))
    this.twoWayBinding.subscribe(next => console.log(`new value: ${next}`))
  }
  
  // in this example we want to demonstrate 
  // regeneration of the value based on the observableSignal
  // hence we fool Aurelia into thinking it's computed from 'nothing'
  @computedFrom('nothing')
  get random() {
    return Math.random()
  }
}
```

## Dependencies

* [aurelia-binding-functions](https://github.com/niieani/aurelia-binding-functions)
* [rxjs 5](https://github.com/ReactiveX/RxJS)

## Used By

This library isn't used by Aurelia. It is an optional plugin.

## Platform Support

This library can be used in the **browser** as well as on the **server**.

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. Ensure that [Gulp](http://gulpjs.com/) is installed. If you need to install it, use the following command:

  ```shell
  npm install -g gulp
  ```
4. To build the code, you can now run:

  ```shell
  gulp build
  ```
5. You will find the compiled code in the `dist` folder, available in three module formats: AMD, CommonJS and ES6.

6. See `gulpfile.js` for other tasks related to generating the docs and linting.

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Ensure that the [Karma](http://karma-runner.github.io/) CLI is installed. If you need to install it, use the following command:

  ```shell
  npm install -g karma-cli
  ```
2. Ensure that [jspm](http://jspm.io/) is installed. If you need to install it, use the following commnand:

  ```shell
  npm install -g jspm
  ```
3. Install the client-side dependencies with jspm:

  ```shell
  jspm install
  ```

4. You can now run the tests with this command:

  ```shell
  karma start
  ```
