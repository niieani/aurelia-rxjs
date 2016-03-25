import {BindingFunction} from 'aurelia-binding-functions'
import {LogManager, FrameworkConfiguration} from 'aurelia-framework'

import {CallScope, Scope, getContextFor, Binding, Listener, Expression} from 'aurelia-binding'
import {View} from 'aurelia-templating'
import {sourceContext} from 'aurelia-binding'
// import {Observable, Observer, Subscription, ReplaySubject, BehaviorSubject, Subject} from 'rxjs/Rx'

const logger = LogManager.getLogger('aurelia-rxjs')

export function configure(frameworkConfig: FrameworkConfiguration) {
  const viewResources = frameworkConfig.aurelia.resources
  const bindingBehaviorInstance = frameworkConfig.container.get(ObservableSignalBindingBehavior)
  viewResources.registerBindingBehavior('observableSignal', bindingBehaviorInstance)
  
  const rxBindingFunctionInstance = frameworkConfig.container.get(RxBindingFunction)
  if (typeof viewResources.registerBindingFunction === 'function') {
    viewResources.registerBindingFunction('@rx', rxBindingFunctionInstance)
  } else {
    throw new Error('You need to load the aurelia-binding-functions plugin before aurelia-observable-binding-function.')
  }
}

export class RxBindingFunction implements BindingFunction {
  connect(callScope: CallScope, binding: Binding, scope: Scope) {
    logger.debug('[connect] start connect for VALUE:', callScope.args[0].name)
    
    const observable = callScope.args[0].evaluate(scope, binding.lookupFunctions, true) //as Subject<any | ChangeWithMetadata<any>>
    
    if (observable && typeof observable.subscribe === 'function') {
      // observe the underlying property to trigger when inner value changed (eg. if an array - observe its changes)
      binding.observeProperty(observable, 'value')
    } else {
      logger.error('[connect] the argument passed in to the binding is not an Observable', observable)
    }
  }
  
  assign(callScope: CallScope, scope: Scope, value: any, lookupFunctions: any): any {
    const observable = callScope.args[0].evaluate(scope, lookupFunctions, true) //as Subject<any>
    if (observable && typeof observable.next === 'function') {
      logger.debug('[assign]', callScope.args[0].name, value, callScope, scope)
      // TODO for Cycle.js:
      // const rxValueContext = getContextFor('rxValue', scope, callScope.ancestor)
      if (observable.value !== value)
        observable.next(value)
    } else {
      logger.error('[assign] trying to set a value but no underlying Observer exists for:', callScope.args[0].name)
      logger.error(`Binding expression "${callScope.args[0].name}" cannot be assigned to.`, callScope)        
      // throw new Error(`Binding expression "${callScope.args[0].name}" cannot be assigned to.`)
    }
  }
  
  evaluate(callScope: CallScope, scope: Scope, lookupFunctions, mustEvaluate: boolean) {
    const observable = callScope.args[0].evaluate(scope, lookupFunctions, true) //as Observable<any> & { value: any }
    if (observable) {
      if (!observable._aureliaIsListener) { // it's a value
        if (typeof observable.subscribe === 'function') {
          logger.debug('[evaluate] retrieve last value of:', callScope.args[0].name, observable.value, observable)
          return observable.value
        }
        logger.error('[evaluate] trying to get a value but no underlying observable exists for:', callScope.args[0].name)
      } else { // it is a method
        if (typeof observable.next === 'function') {
          const event = scope.overrideContext.$event
          if (!event) {
            // this simply means it was not an action that was triggered, 
            // but that we are binding TO the action, and the system wants its value
            // it is safer to bind to the observable directly
            // instead of assuming the person is binding and not evaluating
            return observable
          }
          const argsToEval = Array.from(callScope.args)
          argsToEval.shift()
          const args = argsToEval.map(arg => arg.evaluate(scope, lookupFunctions))
          logger.debug('[evaluate] trigger an action of:', callScope.args[0].name, {event, args})        
          observable.next({ event, arguments: args, scope })
          return //observable.onTriggerReturn
        } else {
          logger.error('[evaluate] trying to trigger an action but no underlying subject exists:', callScope.args[0].name)
        }
      }
    } else {
      logger.error('[evaluate] trying to get a value but no underlying observable/subject exists for:', callScope.args[0].name)
    }
  }
  
  bind(callScope: CallScope, binding: Binding, scope: Scope, lookupFunctions) {
    const observable = callScope.args[0].evaluate(scope, lookupFunctions, true) //as Subject<any>
    logger.debug(`[bind] [${callScope.name}]`, callScope.args[0].name, callScope, binding, scope, 'value of target', observable)
    
    if (observable && typeof observable.subscribe === 'function') {
      binding._observableReference = observable
      observable._aureliaBindCount = (observable._aureliaBindCount || 0) + 1
      
      if (binding instanceof Listener) {
        observable._aureliaIsListener = true
      }
      else if (!observable._aureliaSubscription) {
        logger.debug('[bind] will subscribe to', callScope.args[0].name)
        
        const subscription = observable
          .subscribe((value) => observable.value = value)

        observable._aureliaSubscription = subscription
      }
      /*
      const getArgs = () => {
        if (!scope.bindingContext) {
          logger.error(`[bind-getargs] sorry, can't get args when no bindingContext exists`)
          return []
        }
        const argsToEval = Array.from(callScope.args)
        argsToEval.shift()
        return evalList(scope, argsToEval, lookupFunctions)
      }
      */
      /* create if non-existent
      if (observable === undefined) {
        let newChangable: Subject<any>
        if (binding instanceof Listener) {
          logger.debug('[bind] will create a changable EVENT observable for', callScope.args[0].name, 'with args method like', () => evalList(scope, callScope.args, lookupFunctions))
          newChangable = new Subject()
          //changableAction(getArgs, aureliaScopeIterator(scope), callScope.args[0].name) // create changableAction
        } else {
          logger.debug('[bind] will create a changable VALUE observable for', callScope.args[0].name)
          newChangable = new ReplaySubject(1) // create empty changable
          // TODO: perhaps setting initial value via argument??
        }
        
        callScope.args[0].assign(scope, newChangable)
        logger.debug('[bind] created an observable for', callScope.args[0].name, 'at scope', scope)
        observable = newChangable
        // we assert that observable is callScope.args[0].evaluate(scope, lookupFunctions, true)
      }
      */
      /*
      if (!observable.getInitialArguments) {
        // in case we pre-created the observable
        // callScope happens when binding to a value in a different context
        // since bind() is ready, but no Observable is in context
        observable.getInitialArguments = getArgs
      }
      
      if (!observable.initialScope)
        observable.initialScope = scope //aureliaScopeIterator(scope)
      
      if (!observable.initialName)
        observable.initialName = callScope.args[0].name
      */
    }
  }
  
  unbind(callScope: CallScope, binding: Binding, scope: Scope) {
    let observable = binding._observableReference
    
    if (observable && typeof observable.subscribe === 'function') {
      console.assert(observable._aureliaBindCount !== undefined && observable._aureliaBindCount > 0, '_aureliaBindCount is wrong')
      
      observable._aureliaBindCount = (observable._aureliaBindCount || 0) - 1
      
      if (observable._aureliaBindCount === 0 && observable._aureliaSubscription) {
        logger.debug(`[unbind] [${callScope.name}] unsubscribing`, callScope.args[0].name, callScope, binding, scope, new Date())
        observable._aureliaSubscription.unsubscribe()
        observable._aureliaSubscription = undefined
        observable._aureliaBindCount = undefined
        observable.value = undefined
        // observable.initialName = undefined
        // observable.initialScope = undefined
        // observable.getInitialArguments = undefined
      }
    } else {
      logger.debug(`[unbind] [${callScope.name}] NOT unsubscribing`, callScope.args[0].name, callScope, binding, scope, new Date())      
    }
  }
}

export class ObservableSignalBindingBehavior {
  bind(binding: Binding & { signalingObservers: Array<Subscription>, call: (context)=>void }, source, ...observables: Array<Observable<any>>) {
    if (!binding.updateTarget) {
      throw new Error('Only property bindings and string interpolation bindings can be signaled.  Trigger, delegate and call bindings cannot be signaled.');
    }
    if (!observables || observables.length === 0)
      throw new Error('Observable name is required.')

    const signalingObservers = new Array<Subscription>()
    for (let observable of observables) {
      signalingObservers.push(
        observable.subscribe(next => binding.call(sourceContext))
      )
    }
    binding.signalingObservers = signalingObservers
  }

  unbind(binding: Binding & { signalingObservers: Array<Subscription> }, source) {
    if (binding.signalingObservers) {
      for (let subscription of binding.signalingObservers) {
        subscription.unsubscribe()
      }
      binding.signalingObservers = undefined
    }
  }
}


/////
/*
function aureliaScopeIterator(scope: Scope) {
  // TODO: while overrideContext is a loop - find the parent
  if (scope.overrideContext.hasOwnProperty('$index') && scope.overrideContext.parentOverrideContext && scope.overrideContext.parentOverrideContext.bindingContext)
    return { overrideContext: scope.overrideContext, parentBindingContext: scope.overrideContext.parentOverrideContext.bindingContext }
}

export class ChangeWithMetadata<T> {
  constructor(public value: T, public binding: Binding = null, public context: any = null, public name: string = null) {}
}


export type AnyEvent = Event | FocusEvent | GamepadEvent | HashChangeEvent | KeyboardEvent | MessageEvent | MouseEvent | MouseWheelEvent | MSGestureEvent | MSManipulationEvent | MSMediaKeyMessageEvent | MSMediaKeyNeededEvent | MSSiteModeEvent | MutationEvent | NavigationCompletedEvent | NavigationEvent | NavigationEventWithReferrer | OfflineAudioCompletionEvent | PageTransitionEvent | PermissionRequestedEvent | PointerEvent | PopStateEvent | ProgressEvent | ScriptNotifyEvent | StorageEvent | SVGZoomEvent | TextEvent | TouchEvent | TrackEvent | TransitionEvent | UIEvent | UnviewableContentIdentifiedEvent | WebGLContextEvent | WheelEvent;
*/
//////////////////////////

// FROM https://github.com/aurelia/binding/blob/master/src/ast.js

var evalListCache = [[],[0],[0,0],[0,0,0],[0,0,0,0],[0,0,0,0,0]];
/// Evaluate the [list] in context of the [scope].
export function evalList(scope, list, lookupFunctions) {
  var length = list.length,
      cacheLength, i;

  for (cacheLength = evalListCache.length; cacheLength <= length; ++cacheLength) {
    evalListCache.push([]);
  }

  var result = evalListCache[length];

  for (i = 0; i < length; ++i) {
    result[i] = list[i].evaluate(scope, lookupFunctions);
  }

  return result;
}
