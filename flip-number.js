import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';

/**
 * `flip-number`
 * Flips to a number using an easing function
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class FlipNumber extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: inline;
        }
      </style>

      [[_displayValue]]
    `;
  }

  static get properties() {
    return {
      value: {
        type: Number,
        value: 0,
        observer: '_valueChanged'
      },
      /** The amount of decimals to show in the value */
      decimals: {
        type: Number,
        value: 0
      },
      /** The time taken in seconds to move between one number and the next */
      duration: {
        type: Number,
        value: 2
      }
    }
  }

  ready() {
    super.ready();
    this._displayValue = this._formatNumber(this.value);
  }

  _valueChanged(value, oldValue) {
    this.value = Number(value);
    this._oldValue = Number(oldValue || 0);
    this._countDown = (this._oldValue > this.value);
    this._frameVal = Number(oldValue);

    this._dec = Math.pow(10, this.decimals);

    if (this.__raf) {
      this._startTime = undefined;
      window.cancelAnimationFrame(this.__raf);
    }

    if (this._oldValue !== this.value) {
      this.__raf = requestAnimationFrame(this._count.bind(this));
    }
  }

  /** The easing function to use when animating the numbers. Uses `easeOutExpo` */
  _easingFn(t, b, c, d) {
    return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
  }

  /** Counts to the new value */
  _count(timestamp) {
    if (!this._startTime) {
      this._startTime = timestamp;
    }

    this._timestamp = timestamp;
    let progress = timestamp - this._startTime;

    const duration = (Number(this.duration) * 1000 || 2000)

    if (this._countDown) {
      this._frameVal = this._oldValue - this._easingFn(progress, 0, this._oldValue - this.value, duration);
    } else {
      this._frameVal = this._easingFn(progress, this._oldValue, this.value - this._oldValue, duration);
    }

    // don't go past new value since progress can exceed duration in the last frame
    if (this._countDown) {
      this._frameVal = (this._frameVal < this.value) ? this.value : this._frameVal;
    } else {
      this._frameVal = (this._frameVal > this.value) ? this.value : this._frameVal;
    }

    // decimal
    this._frameVal = Math.round(this._frameVal * this._dec) / this._dec;

    // format and print value
    this._displayValue = this._formatNumber(this._frameVal);

    // whether to continue
    if (progress < duration) {
      this.__raf = requestAnimationFrame(this._count.bind(this));
    } else {
      // finish!
      this._startTime = undefined;
      window.cancelAnimationFrame(this.__raf);
      this.dispatchEvent(new CustomEvent('flip-number-animation-complete'));
    }
  }

  /** Formats the number using the locales grouping, and decimal separators */
  _formatNumber(num) {
    num = num.toFixed(this.decimals);
    num = Number.parseFloat(num);

    return num.toLocaleString(undefined, { maximumFractionDigits: this.decimals });
  }
}

window.customElements.define('flip-number', FlipNumber);
