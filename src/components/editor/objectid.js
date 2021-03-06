import TypeChecker from 'hadron-type-checker';
import { Element } from 'hadron-document';
import chars from 'utils';

/**
 * CRUD editor for object id values.
 */
class ObjectIdEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    this.element = element;
  }

  /**
   * Complete the object id edit by converting the valid string to an object id
   * object or leaving as invalid.
   */
  complete() {
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this.element.currentValue, 'ObjectId'));
    }
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    try {
      TypeChecker.cast(value, 'ObjectId');
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(Element.Events.Edited);
    } catch (e) {
      this.element.setInvalid(value, this.element.currentType, e.message);
    }
  }

  /**
   * Get the number of characters the value should display.
   *
   * @returns {Number} The number of characters.
   */
  size() {
    return chars(this.element.currentValue);
  }

  /**
   * Start the object id edit.
   */
  start() {
    if (this.element.isCurrentTypeValid()) {
      this.edit(String(this.element.currentValue));
    }
  }

  /**
   * Get the value being edited.
   *
   * @returns {String} The value.
   */
  value() {
    return this.element.currentValue;
  }
}

export default ObjectIdEditor;
