import { cloneElement, FC, isValidElement, ReactElement, ReactNode } from 'react';
import innerText from 'react-innertext';
import is from 'is-lite';

import { LIFECYCLE } from '~/literals';

import { AnyObject, Lifecycle, NarrowPlainObject, Step } from '~/types';

import { hasPosition } from './dom';

interface GetReactNodeTextOptions {
  defaultValue?: any;
  step?: number;
  steps?: number;
}

interface LogOptions {
  /** The data to be logged */
  data: any;
  /** display the log */
  debug?: boolean;
  /** The title the logger was called from */
  title: string;
  /** If true, the message will be a warning */
  warn?: boolean;
}

interface ShouldScrollOptions {
  isFirstStep: boolean;
  lifecycle: Lifecycle;
  previousLifecycle: Lifecycle;
  scrollToFirstStep: boolean;
  step: Step;
  target: HTMLElement | null;
}

/**
 * Get the current browser
 */
export function getBrowser(userAgent: string = navigator.userAgent): string {
  let browser = userAgent;

  if (typeof window === 'undefined') {
    browser = 'node';
  }
  // @ts-expect-error IE support
  else if (document.documentMode) {
    browser = 'ie';
  } else if (/Edge/.test(userAgent)) {
    browser = 'edge';
  }
  // @ts-expect-error Opera 8.0+
  else if (Boolean(window.opera) || userAgent.includes(' OPR/')) {
    browser = 'opera';
  }
  // @ts-expect-error Firefox 1.0+
  else if (typeof window.InstallTrigger !== 'undefined') {
    browser = 'firefox';
  }
  // @ts-expect-error Chrome 1+
  else if (window.chrome) {
    browser = 'chrome';
  }
  // Safari (and Chrome iOS, Firefox iOS)
  else if (/(Version\/([\d._]+).*Safari|CriOS|FxiOS| Mobile\/)/.test(userAgent)) {
    browser = 'safari';
  }

  return browser;
}

/**
 * Get Object type
 */
export function getObjectType(value: unknown): string {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

export function getReactNodeText(input: ReactNode, options: GetReactNodeTextOptions = {}): string {
  const { defaultValue, step, steps } = options;
  let text = innerText(input);

  if (!text) {
    if (
      isValidElement(input) &&
      !Object.values(input.props).length &&
      getObjectType(input.type) === 'function'
    ) {
      const component = (input.type as FC)({});

      text = getReactNodeText(component, options);
    } else {
      text = innerText(defaultValue);
    }
  } else if ((text.includes('{step}') || text.includes('{steps}')) && step && steps) {
    text = text.replace('{step}', step.toString()).replace('{steps}', steps.toString());
  }

  return text;
}

export function hasValidKeys(object: Record<string, unknown>, keys?: Array<string>): boolean {
  if (!is.plainObject(object) || !is.array(keys)) {
    return false;
  }

  return Object.keys(object).every(d => keys.includes(d));
}

/**
 * Convert hex to RGB
 */
export function hexToRGB(hex: string): Array<number> {
  const shorthandRegex = /^#?([\da-f])([\da-f])([\da-f])$/i;
  const properHex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(properHex);

  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [];
}

/**
 * Decide if the step shouldn't skip the beacon
 * @param {Object} step
 *
 * @returns {boolean}
 */
export function hideBeacon(step: Step): boolean {
  return step.disableBeacon || step.placement === 'center';
}

/**
 * Detect legacy browsers
 *
 * @returns {boolean}
 */
export function isLegacy(): boolean {
  return !['chrome', 'safari', 'firefox', 'opera'].includes(getBrowser());
}

/**
 * Log method calls if debug is enabled
 */
export function log({ data, debug = false, title, warn = false }: LogOptions) {
  /* eslint-disable no-console */
  const logFn = warn ? console.warn || console.error : console.log;

  if (debug) {
    if (title && data) {
      console.groupCollapsed(
        `%creact-joyride: ${title}`,
        'color: #ff0044; font-weight: bold; font-size: 12px;',
      );

      if (Array.isArray(data)) {
        data.forEach(d => {
          if (is.plainObject(d) && d.key) {
            logFn.apply(console, [d.key, d.value]);
          } else {
            logFn.apply(console, [d]);
          }
        });
      } else {
        logFn.apply(console, [data]);
      }

      console.groupEnd();
    } else {
      console.error('Missing title or data props');
    }
  }
  /* eslint-enable */
}

/**
 * A function that does nothing.
 */
export function noop() {
  return undefined;
}

/**
 * Type-safe Object.keys()
 */
export function objectKeys<T extends AnyObject>(input: T) {
  return Object.keys(input) as Array<keyof T>;
}

/**
 * Remove properties from an object
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  input: NarrowPlainObject<T>,
  ...filter: K[]
) {
  if (!is.plainObject(input)) {
    throw new TypeError('Expected an object');
  }

  const output: any = {};

  for (const key in input) {
    /* istanbul ignore else */
    if ({}.hasOwnProperty.call(input, key)) {
      if (!filter.includes(key as unknown as K)) {
        output[key] = input[key];
      }
    }
  }

  return output as Omit<T, K>;
}

/**
 * Select properties from an object
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  input: NarrowPlainObject<T>,
  ...filter: K[]
) {
  if (!is.plainObject(input)) {
    throw new TypeError('Expected an object');
  }

  if (!filter.length) {
    return input;
  }

  const output: any = {};

  for (const key in input) {
    /* istanbul ignore else */
    if ({}.hasOwnProperty.call(input, key)) {
      if (filter.includes(key as unknown as K)) {
        output[key] = input[key];
      }
    }
  }

  return output as Pick<T, K>;
}

export function replaceLocaleContent(input: ReactNode, step: number, steps: number): ReactNode {
  const replacer = (text: string) =>
    text.replace('{step}', String(step)).replace('{steps}', String(steps));

  if (getObjectType(input) === 'string') {
    return replacer(input as string);
  }

  if (!isValidElement(input)) {
    return input;
  }

  const { children } = input.props;

  if (getObjectType(children) === 'string' && children.includes('{step}')) {
    return cloneElement(input as ReactElement, {
      children: replacer(children),
    });
  }

  if (Array.isArray(children)) {
    return cloneElement(input as ReactElement, {
      children: children.map((child: ReactNode) => {
        if (typeof child === 'string') {
          return replacer(child);
        }

        return replaceLocaleContent(child, step, steps);
      }),
    });
  }

  if (getObjectType(input.type) === 'function' && !Object.values(input.props).length) {
    const component = (input.type as FC)({});

    return replaceLocaleContent(component, step, steps);
  }

  return input;
}

export function shouldScroll(options: ShouldScrollOptions): boolean {
  const { isFirstStep, lifecycle, previousLifecycle, scrollToFirstStep, step, target } = options;

  return (
    !step.disableScrolling &&
    (!isFirstStep || scrollToFirstStep || lifecycle === LIFECYCLE.TOOLTIP) &&
    step.placement !== 'center' &&
    (!step.isFixed || !hasPosition(target)) && // fixed steps don't need to scroll
    previousLifecycle !== lifecycle &&
    ([LIFECYCLE.BEACON, LIFECYCLE.TOOLTIP] as Array<Lifecycle>).includes(lifecycle)
  );
}

/**
 * Block execution
 */
export function sleep(seconds = 1) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}
