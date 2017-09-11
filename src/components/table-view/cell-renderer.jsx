const React = require('react');
const PropTypes = require('prop-types');
const getComponent = require('hadron-react-bson');
const { Element } = require('hadron-document');

const Actions = require('../../actions');

const initEditors = require('../editor/');

// const util = require('util');

/**
 * The BEM base style name for the cell.
 */
const BEM_BASE = 'table-view-cell';

/**
 * The BEM base style name for the value.
 */
const VALUE_BASE = 'editable-element';

/**
 * The document value class.
 */
const VALUE_CLASS = 'editable-element-value';

/**
 * Invalid value class.
 */
const INVALID_VALUE = `${VALUE_CLASS}-is-invalid-type`;

/**
 * The added constant.
 */
const ADDED = 'is-added';

/**
 * The edited constant.
 */
const EDITED = 'is-edited';

/**
 * The empty constant.
 */
const EMPTY = 'is-empty';

/**
 * The invalid constant.
 */
const INVALID = 'is-invalid';

/**
 * The deleted constant.
 */
const DELETED = 'is-deleted';


/**
 * The custom cell renderer that renders a cell in the table view.
 */
class CellRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.isEmpty = props.value === undefined;
    this.element = props.value;

    this._editors = initEditors(this.element);
  }

  componentDidMount() {
    if (!this.isEmpty) {
      this.subscribeElementEvents();
    }
  }

  /**
   * Unsubscribe from the events.
   */
  componentWillUnmount() {
    if (!this.isEmpty) {
      this.unsubscribeElementEvents();
    }
  }

  subscribeElementEvents() {
    // this.unsubscribeAdded = this.handleAdded.bind(this);
    // this.unsubscribeConverted = this.handleConverted.bind(this);
    // this.unsubscribeInvalid = this.handleInvalid.bind(this);
    this.unsubscribeReverted = this.handleReverted.bind(this);
    this.unsubscribeRemoved = this.handleRemoved.bind(this);
    this.unsubscribeEdited = this.handleEdited.bind(this);

    // this.element.on(Element.Events.Added, this.unsubscribeAdded);
    // this.element.on(Element.Events.Converted, this.unsubscribeConverted);
    // this.element.on(Element.Events.Invalid, this.unsubscribeInvalid);
    this.element.on(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.on(Element.Events.Removed, this.unsubscribeRemoved);
    this.element.on(Element.Events.Edited, this.unsubscribeEdited);
  }

  unsubscribeElementEvents() {
    // this.element.removeListener(Element.Events.Added, this.unsubscribeAdded);
    // this.element.removeListener(Element.Events.Converted, this.unsubscribeConverted);
    // this.element.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
    this.element.removeListener(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.removeListener(Element.Events.Removed, this.unsubscribeRemoved);
    this.element.removeListener(Element.Events.Edited, this.unsubscribeEdited);
  }

  // handleAdded() {
  //   console.log("handle added");
  // }
  // handleConverted() {
  //   console.log("handle converted");
  // }
  // handleInvalid() {
  //   console.log("handle invalid");
  // }

  handleReverted() {
    this.forceUpdate();
  }

  handleRemoved() {
    this.isEmpty = true;
    /* TODO: have to unsubscribe from events when update is called
        Can't do it here or we wouldn't be able to undo or cancel the changes.
        Has to happen in update */
    // this.unsubscribeElementEvents();
    // this.element = null;
  }

  handleEdited() {
    // TODO: set for consistency, state is only really used for update rows.
    this.props.node.data.state = 'modified';
  }

  handleUndo() {
    const oid = this.props.node.data.hadronDocument.getId().toString();
    if (this.element.isAdded()) {
      Actions.elementRemoved(this.element.currentKey, oid, false);
      this.isEmpty = true;
    } else if (this.element.isRemoved()) {
      Actions.elementAdded(this.element.currentKey, this.element.currentType, oid);
    } else {
      Actions.elementTypeChanged(this.element.currentKey, this.element.type, oid);
    }
    this.element.revert();
  }

  renderInvalidCell() {
    let valueClass = `${VALUE_CLASS}-is-${this.element.currentType.toLowerCase()}`;
    valueClass = `${valueClass} ${INVALID_VALUE}`;

    /* Return internal div because invalid cells should only hightlight text? */

    return (
      <div className={valueClass}>
        {this.element.currentValue}
      </div>
    );
  }

  renderValidCell() {
    let className = VALUE_BASE;
    if (this.element.isAdded()) {
      className = `${className} ${VALUE_BASE}-${ADDED}`;
    } else if (this.element.isEdited()) {
      className = `${className} ${VALUE_BASE}-${EDITED}`;
    }

    const component = getComponent(this.element.currentType);
    const element = React.createElement(
      component,
      { type: this.props.value.currentType, value: this.element.currentValue }
    );

    return (
      <div className={className}>
        {element}
      </div>
    );
  }

  renderUndo(classname, canUndo) {
    if (!canUndo) {
      return null;
    }
    return (
      <div className={`${classname}-actions`} onClick={this.handleUndo.bind(this)}>
        <span className={`fa fa-circle ${classname}-actions-background`} aria-hidden />
        <span className={`fa fa-rotate-left ${classname}-actions-background-icon`} aria-hidden />
      </div>
    );
  }

  render() {
    let element;
    let className = BEM_BASE;
    let canUndo = false;

    if (this.isEmpty) {
      element = 'No field';
      className = `${className}-${EMPTY}`;
    } else if (!this.element.isCurrentTypeValid()) {
      element = this.renderInvalidCell();
      className = `${className}-${INVALID}`;
      canUndo = true;
    } else if (this.element.isRemoved()) {
      element = 'Deleted field';
      className = `${className}-${DELETED}`;
      canUndo = true;
    } else {
      element = this.renderValidCell();
      if (this.element.isEdited()) {
        className = `${className}-${EDITED}`;
        canUndo = true;
      } else if (this.element.isAdded()) {
        className = `${className}-${ADDED}`;
        canUndo = true;
      }
    }

    return (
      <div className={className}>
        {this.renderUndo(className, canUndo)}
        {element}
      </div>
    );
  }
}

CellRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any,
  node: PropTypes.any
};

CellRenderer.displayName = 'CellRenderer';

module.exports = CellRenderer;
