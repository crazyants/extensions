﻿import * as React from 'react'
import { Tabs, Tab } from 'react-bootstrap'
import {
    FormGroup, FormControlStatic, ValueLine, ValueLineType, EntityLine, EntityCombo, EntityList, EntityRepeater, EntityTabRepeater, EntityTable,
    EntityCheckboxList, EnumCheckboxList, EntityDetail, EntityStrip, RenderEntity
} from '../../../../Framework/Signum.React/Scripts/Lines'

import { ModifiableEntity, Entity, Lite, isEntity } from '../../../../Framework/Signum.React/Scripts/Signum.Entities'
import { classes, Dic } from '../../../../Framework/Signum.React/Scripts/Globals'
import * as Finder from '../../../../Framework/Signum.React/Scripts/Reflection'
import { SubTokensOptions } from '../../../../Framework/Signum.React/Scripts/FindOptions'
import { FindOptions, SearchControl, ValueSearchControlLine } from '../../../../Framework/Signum.React/Scripts/Search'
import {
    getQueryNiceName, TypeInfo, MemberInfo, getTypeInfo, EntityData, EntityKind, getTypeInfos, KindOfType,
    PropertyRoute, PropertyRouteType, LambdaMemberType, isTypeEntity, Binding, IsByAll, getAllTypes
} from '../../../../Framework/Signum.React/Scripts/Reflection'
import * as Navigator from '../../../../Framework/Signum.React/Scripts/Navigator'
import { TypeContext, FormGroupStyle } from '../../../../Framework/Signum.React/Scripts/TypeContext'
import { EntityBase, EntityBaseProps } from '../../../../Framework/Signum.React/Scripts/Lines/EntityBase'
import { EntityTableColumn } from '../../../../Framework/Signum.React/Scripts/Lines/EntityTable'
import { DynamicViewValidationMessage } from '../Signum.Entities.Dynamic'
import { ExpressionOrValueComponent, FieldComponent } from './Designer'
import { ExpressionOrValue, Expression, bindExpr, toCodeEx, withClassNameEx} from './NodeUtils'
import { FindOptionsLine, QueryTokenLine } from './FindOptionsComponent'
import { HtmlAttributesLine } from './HtmlAttributesComponent'
import { StyleOptionsLine } from './StyleOptionsComponent'
import * as NodeUtils from './NodeUtils'
import { registeredCustomContexts } from '../DynamicViewClient'
import { toFindOptions, FindOptionsExpr } from './FindOptionsExpression'
import { toHtmlAttributes, HtmlAttributesExpression, withClassName } from './HtmlAttributesExpression'
import { toStyleOptions, subCtx, StyleOptionsExpression } from './StyleOptionsExpression'
import FileLine from "../../Files/FileLine";
import { DownloadBehaviour } from "../../Files/FileDownloader";
import { registerSymbol } from "../../../../Framework/Signum.React/Scripts/Reflection";

export interface BaseNode {
    kind: string;
    visible?: ExpressionOrValue<boolean>;
}

export interface ContainerNode extends BaseNode {
    children: BaseNode[]
}

export interface DivNode extends ContainerNode {
    kind: "Div",
    field?: string;
    styleOptions?: StyleOptionsExpression;
    htmlAttributes?: HtmlAttributesExpression;
}

NodeUtils.register<DivNode>({
    kind: "Div",
    group: "Container",
    order: 0,
    isContainer: true,
    renderTreeNode: NodeUtils.treeNodeKind,
    renderCode: (node, cc) => cc.elementCodeWithChildrenSubCtx("div", node.htmlAttributes, node),
    render: (dn, parentCtx) => NodeUtils.withChildrensSubCtx(dn, parentCtx, <div {...toHtmlAttributes(parentCtx, dn.node.htmlAttributes) } />),
    renderDesigner: dn => (<div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
        <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.htmlAttributes)} />
    </div>),
});

export interface RowNode extends ContainerNode {
    kind: "Row", 
    field?: string;
    styleOptions?: StyleOptionsExpression;
    htmlAttributes?: HtmlAttributesExpression;
}

NodeUtils.register<RowNode>({
    kind: "Row",
    group: "Container",
    order: 1,
    isContainer: true,
    validChild: "Column",
    renderTreeNode: NodeUtils.treeNodeKind,
    validate: (dn, parentCtx) => parentCtx && dn.node.children.filter(c => c.kind == "Column").map(col =>
        (NodeUtils.evaluate(parentCtx, col, f => (f as ColumnNode).width) || 0) +
        (NodeUtils.evaluate(parentCtx, col, f => (f as ColumnNode).offset) || 0)
    ).sum() > 12 ? "Sum of Column.width/offset should <= 12" : null,
    renderCode: (node, cc) => cc.elementCodeWithChildrenSubCtx("div", withClassNameEx(node.htmlAttributes, "row"), node),
    render: (dn, parentCtx) => NodeUtils.withChildrensSubCtx(dn, parentCtx, <div {...withClassName(toHtmlAttributes(parentCtx, dn.node.htmlAttributes), "row") } />),
    renderDesigner: dn => (<div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
        <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.htmlAttributes)} />
    </div>),
});


export interface ColumnNode extends ContainerNode {
    kind: "Column";
    field?: string;
    styleOptions?: StyleOptionsExpression;
    htmlAttributes?: HtmlAttributesExpression;
    width: ExpressionOrValue<number>;
    offset: ExpressionOrValue<number>;
}

NodeUtils.register<ColumnNode>({
    kind: "Column",
    group: null,
    order: null,
    isContainer: true,
    avoidHighlight: true,
    validParent: "Row",
    validate: dn => NodeUtils.mandatory(dn, n => n.width),
    initialize: dn => dn.width = 6,
    renderTreeNode: NodeUtils.treeNodeKind, 
    renderCode: (node, cc) => {
        const className = node.offset == null ?
            bindExpr(column => "col-sm-" + column, node.width) :
            bindExpr((column, offset) => classes("col-sm-" + column, offset != undefined && "col-sm-offset-" + offset), node.width, node.offset);

        return cc.elementCodeWithChildrenSubCtx("div", withClassNameEx(node.htmlAttributes, className), node);
    },
    render: (dn, parentCtx) => {
        const column = NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.width, NodeUtils.isNumber);
        const offset = NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.offset, NodeUtils.isNumberOrNull);
        const className = classes("col-sm-" + column, offset != undefined && "col-sm-offset-" + offset)

        return NodeUtils.withChildrensSubCtx(dn, parentCtx, <div {...withClassName(toHtmlAttributes(parentCtx, dn.node.htmlAttributes), className)} />);
    },
    renderDesigner: (dn) => (<div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
        <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.htmlAttributes)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.width)} type="number" options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.offset)} type="number" options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} defaultValue={null} />
    </div>),
});

export interface TabsNode extends ContainerNode {
    kind: "Tabs";
    field?: string;
    styleOptions?: StyleOptionsExpression;
    id: ExpressionOrValue<string>;
    defaultActiveKey?: string;
}

NodeUtils.register<TabsNode>({
    kind: "Tabs",
    group: "Container",
    order: 2,
    isContainer: true,
    validChild: "Tab",
    initialize: dn => dn.id = "tabs", 
    renderTreeNode: NodeUtils.treeNodeKind,
    renderCode: (node, cc) => cc.elementCodeWithChildrenSubCtx("Tabs", {
        id: { __code__: cc.ctxName  + ".compose(" + toCodeEx(node.id) + ")" } as Expression<string>, 
        defaultActiveKey: node.defaultActiveKey
    }, node),
    render: (dn, parentCtx) => {
        return NodeUtils.withChildrensSubCtx(dn, parentCtx, <Tabs
            id={parentCtx.compose(NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.id, NodeUtils.isString) !)}
            defaultActiveKey={dn.node.defaultActiveKey} />);
    },
    renderDesigner: (dn) => (<div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
        <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.id)} type="string" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.defaultActiveKey)} type="string" defaultValue={null} allowsExpression={false} />
    </div>),
});


export interface TabNode extends ContainerNode {
    kind: "Tab";
    field?: string;
    styleOptions?: StyleOptionsExpression;
    title: ExpressionOrValue<string>;
    eventKey: string;
}

NodeUtils.register<TabNode>({
    kind: "Tab",
    group: null,
    order: null,
    isContainer: true,
    avoidHighlight: true,
    validParent: "Tabs",
    initialize: (n, parentNode) => {
        let byName = parentNode.node.children.map(a => parseInt((a as TabNode).eventKey.tryAfter("tab") || "")).filter(s => isFinite(s)).max() + 1;
        let byPosition = parentNode.node.children.length + 1;
        let index = Math.max(byName, byPosition);
        n.title = "My Tab " + index;
        n.eventKey = "tab" + index;
    },
    renderTreeNode: dn => <span><small>{dn.node.kind}:</small> <strong>{dn.node.title}</strong></span>,
    validate: dn => NodeUtils.mandatory(dn, n => n.eventKey),
    renderCode: (node, cc) => cc.elementCodeWithChildrenSubCtx("Tab", {
        title: node.title,
        eventKey: node.eventKey
    }, node),
    render: (dn, parentCtx) => {
        return NodeUtils.withChildrensSubCtx(dn, parentCtx, <Tab
            title={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.title, NodeUtils.isString)}
            eventKey={dn.node.eventKey} />);
    },
    renderDesigner: (dn) => (<div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
        <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.eventKey)} type="string" defaultValue={null} allowsExpression={false} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.title)} type="string" defaultValue={null} />
    </div>),
});


export interface FieldsetNode extends ContainerNode {
    kind: "Fieldset";
    field?: string;
    styleOptions?: StyleOptionsExpression;
    htmlAttributes?: HtmlAttributesExpression;
    legendHtmlAttributes?: HtmlAttributesExpression;
    legend: ExpressionOrValue<string>;
}

NodeUtils.register<FieldsetNode>({
    kind: "Fieldset",
    group: "Container",
    order: 3,
    isContainer: true,
    initialize: dn => dn.legend = "My Fieldset",
    renderTreeNode: NodeUtils.treeNodeKind,
    renderCode: (node, cc) => cc.elementCode("fieldset", node.htmlAttributes,
        cc.elementCode("legend", node.legendHtmlAttributes, toCodeEx(node.legend)),
        cc.elementCodeWithChildrenSubCtx("div", null, node)
    ),
    render: (dn, parentCtx) => {
        return (
            <fieldset {...toHtmlAttributes(parentCtx, dn.node.htmlAttributes) }>
                <legend {...toHtmlAttributes(parentCtx, dn.node.legendHtmlAttributes) }>
                        {NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.legend, NodeUtils.isString)}
                </legend>
            {NodeUtils.withChildrensSubCtx(dn,  parentCtx, <div />)}
            </fieldset>
        )
    },
    renderDesigner: (dn) => (<div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
        <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.htmlAttributes)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.legend)} type="string" defaultValue={null} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.legendHtmlAttributes)} />
    </div>),
});



export interface TextNode extends BaseNode {
    kind: "Text",
    htmlAttributes?: HtmlAttributesExpression;
    breakLines?: ExpressionOrValue<boolean>
    tagName?: ExpressionOrValue<string>;
    message: ExpressionOrValue<string>;
}

NodeUtils.register<TextNode>({
    kind: "Text",
    group: "Container",
    order: 4,
    initialize: dn => { dn.message = "My message"; },
    renderTreeNode: dn => <span><small>{dn.node.kind}:</small> <strong>{dn.node.message ? (typeof dn.node.message == "string" ? dn.node.message : (dn.node.message.__code__ || "")).etc(20) : ""}</strong></span>,
    renderCode: (node, cc) => cc.elementCode(bindExpr(tagName => tagName || "p", node.tagName), node.htmlAttributes,
        toCodeEx(node.message)
    ),
    render: (dn, ctx) => React.createElement(
        NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.tagName, NodeUtils.isStringOrNull) || "p",
        toHtmlAttributes(ctx, dn.node.htmlAttributes),
        ...NodeUtils.addBreakLines(
            NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.breakLines, NodeUtils.isBooleanOrNull) || false,
            NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.message, NodeUtils.isString) !),
    ),
    renderDesigner: dn => (<div>
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.tagName)} type="string" defaultValue={"p"} options={["p", "span", "div", "pre", "code", "strong", "em", "del", "sub", "sup", "ins", "h1", "h2", "h3", "h4", "h5"]} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.message)} type="textArea" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.breakLines)} type="boolean" defaultValue={false} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.htmlAttributes)} />
    </div>),
});


export interface RenderEntityNode extends ContainerNode {
    kind: "RenderEntity";
    field: string;
    getViewName?: Expression<(e : ModifiableEntity) => string>;
    styleOptions?: StyleOptionsExpression;
}


NodeUtils.register<RenderEntityNode>({
    kind: "RenderEntity",
    group: "Container",
    order: 5,
    isContainer: true,
    hasEntity: true,
    validate: (dn, ctx) => NodeUtils.validateField(dn),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("RenderEntity", {
        ctx: cc.subCtxCode(node.field, node.styleOptions),
        getComponent: cc.getGetComponentEx(node, true),
        getViewName: node.getViewName,
    }),
    render: (dn, ctx) => {
        var sctx = ctx.subCtx(dn.node.field, toStyleOptions(ctx, dn.node.styleOptions));
        return (
            <RenderEntity
                ctx={sctx}
                getComponent={NodeUtils.getGetComponent(dn)}
                getViewPromise={NodeUtils.evaluateAndValidate(sctx, dn.node, n => n.getViewName, NodeUtils.isFunctionOrNull)}
            />
        );
    },
    renderDesigner: dn => <div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
        <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.getViewName)} type={null} defaultValue={false} exampleExpression={"e => \"MyStaticOrDynamicViewName\""} />  
    </div>,
});

export interface CustomContextNode extends ContainerNode {
    kind: "CustomContext",
    typeContext: string;
}

NodeUtils.register<CustomContextNode>({
    kind: "CustomContext",
    group: "Container",
    order: 6,
    isContainer: true,
    validate: dn => NodeUtils.mandatory(dn, n => n.typeContext) || (!registeredCustomContexts[dn.node.typeContext] ? `${dn.node.typeContext} not found` : undefined),
    renderTreeNode: dn => <span><small > {dn.node.kind}:</small > <strong>{dn.node.typeContext}</strong></span >,
    renderCode: (node, cc) => {
        const ncc = registeredCustomContexts[node.typeContext].getCodeContext(cc);
        var childrensCode = node.children.map(c => NodeUtils.renderCode(c, ncc));
        return ncc.elementCode("div", null, ...childrensCode);
    },
    render: (dn, parentCtx) => {
        const nctx = registeredCustomContexts[dn.node.typeContext].getTypeContext(parentCtx);
        if (!nctx)
            return undefined;

        return NodeUtils.withChildrensSubCtx(dn, nctx, <div />);
    },
    renderDesigner: dn => (<div>
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.typeContext)} allowsExpression={false} type="string" options={Dic.getKeys(registeredCustomContexts)} defaultValue={null} />
    </div>),
});

export interface TypeIsNode extends ContainerNode {
    kind: "TypeIs",
    typeName: string;
}

NodeUtils.register<TypeIsNode>({
    kind: "TypeIs",
    group: "Container",
    order: 7,
    isContainer: true,
    validate: dn => NodeUtils.mandatory(dn, n => n.typeName) || (!getTypeInfo(dn.node.typeName) ? `Type '${dn.node.typeName}' not found` : undefined),
    renderTreeNode: dn => <span><small> {dn.node.kind}:</small > <strong>{dn.node.typeName}</strong></span>,
    renderCode: (node, cc) => {
        const ncc = cc.createNewContext("ctx" + (cc.usedNames.length + 1));
        cc.assignments[ncc.ctxName] = `${node.typeName}Entity.isInstanceOf(${cc.ctxName}.value) ? ${cc.ctxName}.cast(${node.typeName}) : null`;
        var childrensCode = node.children.map(c => NodeUtils.renderCode(c, ncc));
        return "{" + ncc.ctxName + " && " + ncc.elementCode("div", null, ...childrensCode) + "}";
    },
    render: (dn, parentCtx) => {
        if (!isEntity(parentCtx.value) || parentCtx.value.Type != dn.node.typeName)
            return undefined;

        const nctx = TypeContext.root(parentCtx.value, undefined, parentCtx);

        return NodeUtils.withChildrensSubCtx(dn, nctx, <div />);
    },
    renderDesigner: dn => (<div>
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.typeName)} allowsExpression={false} type="string" options={getTypes(dn.route)} defaultValue={null} />
    </div>),
});

function getTypes(route: PropertyRoute | undefined): string[] | ((query: string) => string[]) {

    if (route == undefined)
        return [];

    var tr = route.typeReference();
    if (tr.name == IsByAll)
        return autoCompleteType;

    var types = getTypeInfos(tr);
    if (types.length == 0 || types[0] == undefined)
        return [];

    return types.map(a => a.name);
}

function autoCompleteType(query: string): string[] {
    return getAllTypes()
        .filter(ti => ti.kind == "Entity" && ti.name.toLowerCase().contains(query.toLowerCase()))
        .map(a => a.name)
        .orderBy(a => a.length)
        .filter((k, i) => i < 5);
}

export interface LineBaseNode extends BaseNode {
    labelText?: ExpressionOrValue<string>;
    field: string;
    styleOptions?: StyleOptionsExpression;
    readOnly?: ExpressionOrValue<boolean>;
    onChange?: Expression<() => void>;
    labelHtmlAttributes?: HtmlAttributesExpression;
    formGroupHtmlAttributes?: HtmlAttributesExpression;
}

export interface ValueLineNode extends LineBaseNode {
    kind: "ValueLine",
    textArea?: ExpressionOrValue<string>;
    unitText?: ExpressionOrValue<string>;
    formatText?: ExpressionOrValue<string>;
    autoTrim?: ExpressionOrValue<boolean>;
    inlineCheckbox?: ExpressionOrValue<boolean>;
    valueHtmlAttributes?: HtmlAttributesExpression;
}

NodeUtils.register<ValueLineNode>({
    kind: "ValueLine",
    group: "Property",
    order: 0,
    validate: (dn) => NodeUtils.validateFieldMandatory(dn),
    renderTreeNode: NodeUtils.treeNodeKindField, 
    renderCode: (node, cc) => cc.elementCode("ValueLine", {
        ctx: cc.subCtxCode(node.field, node.styleOptions),
        labelText: node.labelText,
        labelHtmlAttributes: node.labelHtmlAttributes,
        formGroupHtmlAttributes: node.formGroupHtmlAttributes,
        valueHtmlAttributes: node.valueHtmlAttributes,
        unitText: node.unitText,
        formatText: node.formatText,
        readOnly: node.readOnly,
        inlineCheckbox: node.inlineCheckbox,
        valueLineType: node.textArea && bindExpr(ta => ta ? "TextArea" : undefined, node.textArea),
        autoTrim: node.autoTrim,
        onChange: node.onChange
    }),
    render: (dn, ctx) => (<ValueLine
        ctx={ctx.subCtx(dn.node.field, toStyleOptions(ctx, dn.node.styleOptions))}
        labelText={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.labelText, NodeUtils.isStringOrNull)}
        labelHtmlAttributes={toHtmlAttributes(ctx, dn.node.labelHtmlAttributes)}
        formGroupHtmlAttributes={toHtmlAttributes(ctx, dn.node.formGroupHtmlAttributes)}
        valueHtmlAttributes={toHtmlAttributes(ctx, dn.node.valueHtmlAttributes)}
        unitText={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.unitText, NodeUtils.isStringOrNull)}
        formatText={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.formatText, NodeUtils.isStringOrNull)}
        readOnly={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.readOnly, NodeUtils.isBooleanOrNull)}
        inlineCheckbox={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.inlineCheckbox, NodeUtils.isBooleanOrNull)}
        valueLineType={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.textArea, NodeUtils.isBooleanOrNull) ? "TextArea" : undefined}
        autoFixString={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.autoTrim, NodeUtils.isBooleanOrNull)}
        onChange={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.onChange, NodeUtils.isFunctionOrNull)}
        />),
    renderDesigner: (dn) => {
        const m = dn.route && dn.route.member;
        return (<div>
            <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
            <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.labelText)} type="string" defaultValue={m && m.niceName || ""} />
            <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.labelHtmlAttributes)} />
            <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.formGroupHtmlAttributes)} />
            <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.valueHtmlAttributes)} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.unitText)} type="string" defaultValue={m && m.unit || ""} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.formatText)} type="string" defaultValue={m && m.format || ""} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.readOnly)} type="boolean" defaultValue={null} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.inlineCheckbox)} type="boolean" defaultValue={false} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.textArea)} type="boolean" defaultValue={false} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.autoTrim)} type="boolean" defaultValue={true} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.onChange)} type={null} defaultValue={false} exampleExpression={"() => this.forceUpdate()"} />
        </div>)
    },
});


export interface EntityBaseNode extends LineBaseNode, ContainerNode {
    create?: ExpressionOrValue<boolean>;
    onCreate?: Expression<() => Promise<ModifiableEntity | Lite<Entity> | undefined> | undefined>
    find?: ExpressionOrValue<boolean>;
    onFind?: Expression<() => Promise<ModifiableEntity | Lite<Entity> | undefined> | undefined>
    remove?: ExpressionOrValue<boolean | ((item: ModifiableEntity | Lite<Entity>) => boolean)>
    onRemove?: Expression<(remove: ModifiableEntity | Lite<Entity>) => Promise<boolean>>
    view?: ExpressionOrValue<boolean | ((item: ModifiableEntity | Lite<Entity>) => boolean)>
    onView?: Expression<(entity: ModifiableEntity | Lite<Entity>, pr: PropertyRoute) => Promise<ModifiableEntity | undefined> | undefined>
    viewOnCreate?: ExpressionOrValue<boolean>;
    findOptions?: FindOptionsExpr;
}

export interface EntityLineNode extends EntityBaseNode {
    kind: "EntityLine",
    autoComplete?: ExpressionOrValue<boolean>;
}

NodeUtils.register<EntityLineNode>({
    kind: "EntityLine",
    group: "Property",
    order: 1,
    isContainer: true,
    hasEntity: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityLine", cc.getEntityBasePropsEx(node, { showAutoComplete: true })),
    render: (dn, ctx) => (<EntityLine {...NodeUtils.getEntityBaseProps(dn, ctx, { showAutoComplete: true }) } />),
    renderDesigner: dn => NodeUtils.designEntityBase(dn, { isCreable: true, isFindable: true, isViewable: true, showAutoComplete: true }),
});


export interface EntityComboNode extends EntityBaseNode {
    kind: "EntityCombo",
}

NodeUtils.register<EntityComboNode>({
    kind: "EntityCombo",
    group: "Property",
    order: 2,
    isContainer: true,
    hasEntity: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityCombo", cc.getEntityBasePropsEx(node, { })),
    render: (dn, ctx) => (<EntityCombo {...NodeUtils.getEntityBaseProps(dn, ctx, {}) } />),
    renderDesigner: dn => NodeUtils.designEntityBase(dn, { isCreable: false, isFindable: false, isViewable: false, showAutoComplete: false }),
});

export interface EntityDetailNode extends EntityBaseNode, ContainerNode {
    kind: "EntityDetail",
}

NodeUtils.register<EntityDetailNode>({
    kind: "EntityDetail",
    group: "Property",
    order: 3,
    isContainer: true,
    hasEntity: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityDetail", cc.getEntityBasePropsEx(node, {})),
    render: (dn, ctx) => (<EntityDetail {...NodeUtils.getEntityBaseProps(dn, ctx, {}) } />),
    renderDesigner: dn => NodeUtils.designEntityBase(dn, { isCreable: true, isFindable: true, isViewable: false, showAutoComplete: false }),
});

export interface FileLineNode extends EntityBaseNode {
    kind: "FileLine",
    download?: ExpressionOrValue<DownloadBehaviour>;
    dragAndDrop?: ExpressionOrValue<boolean>;
    dragAndDropMessage?: ExpressionOrValue<string>;
    fileType?: ExpressionOrValue<string>;
    accept?: ExpressionOrValue<string>;
}

const DownloadBehaviours: DownloadBehaviour[] = ["SaveAs", "View", "None"];

NodeUtils.register<FileLineNode>({
    kind: "FileLine",
    group: "Property",
    order: 4,
    isContainer: false,
    hasEntity: true,
    validate: (dn, ctx) => NodeUtils.validateFieldMandatory(dn),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("FileLine", {
        ctx: cc.subCtxCode(node.field, node.styleOptions),
        labelText: node.labelText,
        labelHtmlAttributes: node.labelHtmlAttributes,
        formGroupHtmlAttributes: node.formGroupHtmlAttributes,
        visible: node.visible,
        readOnly: node.readOnly,
        remove: node.remove,
        download: node.download,
        dragAndDrop: node.dragAndDrop,
        dragAndDropMessage: node.dragAndDropMessage,
        fileType: bindExpr(key => registerSymbol("FileType", key), node.fileType),
        accept: node.accept,
        onChange: node.onChange
    }),
    render: (dn, parentCtx) => (<FileLine
        ctx={parentCtx.subCtx(dn.node.field, toStyleOptions(parentCtx, dn.node.styleOptions))}
        labelText={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.labelText, NodeUtils.isStringOrNull)}
        labelHtmlAttributes={toHtmlAttributes(parentCtx, dn.node.labelHtmlAttributes)}
        formGroupHtmlAttributes={toHtmlAttributes(parentCtx, dn.node.formGroupHtmlAttributes)}
        visible={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.visible, NodeUtils.isBooleanOrNull)}
        readOnly={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.readOnly, NodeUtils.isBooleanOrNull)}
        remove={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.remove, NodeUtils.isBooleanOrNull)}
        download={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.download, a => NodeUtils.isInListOrNull(a, DownloadBehaviours))}
        dragAndDrop={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.dragAndDrop, NodeUtils.isBooleanOrNull)}
        dragAndDropMessage={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.dragAndDropMessage, NodeUtils.isStringOrNull)}
        fileType={toFileTypeSymbol(NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.fileType, NodeUtils.isStringOrNull))}
        accept={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.accept, NodeUtils.isStringOrNull)}
        onChange={NodeUtils.evaluateAndValidate(parentCtx, dn.node, n => n.onChange, NodeUtils.isFunctionOrNull)}
    />),
    renderDesigner: dn => {
        const m = dn.route && dn.route.member;
        return (
            <div>
                <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
                <StyleOptionsLine dn={dn} binding={Binding.create(dn.node, n => n.styleOptions)} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.labelText)} type="string" defaultValue={m && m.niceName || ""} />
                <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.labelHtmlAttributes)} />
                <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.formGroupHtmlAttributes)} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.readOnly)} type="boolean" defaultValue={null} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.remove)} type="boolean" defaultValue={null} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.download)} type="string" defaultValue={null} options={DownloadBehaviours} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.dragAndDrop)} type="boolean" defaultValue={null} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.dragAndDropMessage)} type="string" defaultValue={null} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.fileType)} type="string" defaultValue={null} options={getFileTypes()} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.accept)} type="string" defaultValue={null} />
                <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.onChange)} type={null} defaultValue={null} />
            </div>
        );
    }
});

function getFileTypes() {
    return getAllTypes()
        .filter(a => a.kind == "SymbolContainer" && a.name.endsWith("FileType"))
        .flatMap(t => Dic.getValues(t.members).map(m => t.name + "." + m.name));
}

function toFileTypeSymbol(fileTypeKey?: string)
{
    if (fileTypeKey == undefined)
        return undefined;

    return registerSymbol("FileType", fileTypeKey);
}

export interface EnumCheckboxListNode extends LineBaseNode {
    kind: "EnumCheckboxList",
    columnCount?: ExpressionOrValue<number>;
    columnWidth?: ExpressionOrValue<number>;
    avoidFieldSet?: ExpressionOrValue<boolean>;
}

NodeUtils.register<EnumCheckboxListNode>({
    kind: "EnumCheckboxList",
    group: "Collection",
    order: 0,
    hasCollection: true,
    validate: (dn) => NodeUtils.validateFieldMandatory(dn),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EnumCheckboxList", {
        ctx: cc.subCtxCode(node.field, node.styleOptions),
        labelText: node.labelText,
        avoidFieldSet: node.avoidFieldSet,
        readOnly: node.readOnly,
        columnCount: node.columnCount,
        columnWidth: node.columnWidth,
        onChange: node.onChange,
    }),
    render: (dn, ctx) => (<EnumCheckboxList
        ctx={ctx.subCtx(dn.node.field, toStyleOptions(ctx, dn.node.styleOptions))}
        labelText={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.labelText, NodeUtils.isStringOrNull)}
        avoidFieldSet={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.avoidFieldSet, NodeUtils.isBooleanOrNull)}
        readOnly={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.readOnly, NodeUtils.isBooleanOrNull)}
        columnCount={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.columnCount, NodeUtils.isNumberOrNull)}
        columnWidth={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.columnWidth, NodeUtils.isNumberOrNull)}
        onChange={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.onChange, NodeUtils.isFunctionOrNull)}
        />),
    renderDesigner: (dn) => {
        const m = dn.route && dn.route.member;
        return (<div>
            <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.field)} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.labelText)} type="string" defaultValue={m && m.niceName || ""} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.avoidFieldSet)} type="boolean" defaultValue={false} allowsExpression={false} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.readOnly)} type="boolean" defaultValue={null} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.columnCount)} type="number" defaultValue={null} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.columnWidth)} type="number" defaultValue={200} />
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.onChange)} type={null} defaultValue={null} />
        </div>)
    },
});

export interface EntityListBaseNode extends EntityBaseNode {
    move?: ExpressionOrValue<boolean | ((item: ModifiableEntity | Lite<Entity>) => boolean)>;
}

export interface EntityCheckboxListNode extends EntityListBaseNode {
    kind: "EntityCheckboxList",
    columnCount?: ExpressionOrValue<number>;
    columnWidth?: ExpressionOrValue<number>;
    avoidFieldSet?: ExpressionOrValue<boolean>;
}

NodeUtils.register<EntityCheckboxListNode>({
    kind: "EntityCheckboxList",
    group: "Collection",
    order: 1,
    hasEntity: true,
    hasCollection: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityCheckboxList", {...cc.getEntityBasePropsEx(node, { showMove: false }),
        columnCount: node.columnCount,
        columnWidth: node.columnWidth,
        avoidFieldSet: node.avoidFieldSet,
    }),
    render: (dn, ctx) => (<EntityCheckboxList {...NodeUtils.getEntityBaseProps(dn, ctx, { showMove: false }) }
        columnCount={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.columnCount, NodeUtils.isNumberOrNull)}
        columnWidth={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.columnWidth, NodeUtils.isNumberOrNull)}
        avoidFieldSet={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.avoidFieldSet, NodeUtils.isBooleanOrNull)}
        />),
    renderDesigner: dn => <div>
        {NodeUtils.designEntityBase(dn, { isCreable: false, isFindable: false, isViewable: false, showAutoComplete: false, showMove: false })}
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.columnCount)} type="number" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.columnWidth)} type="number" defaultValue={200} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.avoidFieldSet)} type="boolean" defaultValue={false} allowsExpression={false} />
    </div>
});

export interface EntityListNode extends EntityListBaseNode {
    kind: "EntityList",
}

NodeUtils.register<EntityListNode>({
    kind: "EntityList",
    group: "Collection",
    order: 2,
    isContainer: true,
    hasEntity: true,
    hasCollection: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityList",cc.getEntityBasePropsEx(node, { showMove: true })),
    render: (dn, ctx) => (<EntityList {...NodeUtils.getEntityBaseProps(dn, ctx, { showMove: true }) } />),
    renderDesigner: dn => NodeUtils.designEntityBase(dn, { isCreable: true, isFindable: true, isViewable: true, showAutoComplete: false, showMove: true })
});


export interface EntityStripNode extends EntityListBaseNode {
    kind: "EntityStrip",
    autoComplete?: ExpressionOrValue<boolean>;
    vertical?: boolean;
}

NodeUtils.register<EntityStripNode>({
    kind: "EntityStrip",
    group: "Collection",
    order: 3,
    isContainer: true,
    hasEntity: true,
    hasCollection: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityStrip", {...cc.getEntityBasePropsEx(node, { showAutoComplete: true, showMove: false }),
        vertical: node.vertical,
    }),
    render: (dn, ctx) => (<EntityStrip
        {...NodeUtils.getEntityBaseProps(dn, ctx, { showAutoComplete: true, showMove: false }) }
        vertical={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.vertical, NodeUtils.isBooleanOrNull)}
        />),
    renderDesigner: dn =>
        <div>
            {NodeUtils.designEntityBase(dn, { isCreable: false, isFindable: false, isViewable: true, showAutoComplete: true, showMove: false })}
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.vertical)} type="boolean" defaultValue={false} />
        </div>
});


export interface EntityRepeaterNode extends EntityListBaseNode {
    kind: "EntityRepeater",
    avoidFieldSet?: ExpressionOrValue<boolean>;
}

NodeUtils.register<EntityRepeaterNode>({
    kind: "EntityRepeater",
    group: "Collection",
    order: 4,
    isContainer: true,
    hasEntity: true,
    hasCollection: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityRepeater", { ...cc.getEntityBasePropsEx(node, { showMove: true }), avoidFieldSet: node.avoidFieldSet }),
    render: (dn, ctx) => (<EntityRepeater
        {...NodeUtils.getEntityBaseProps(dn, ctx, { showMove: true }) }
        avoidFieldSet={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.avoidFieldSet, NodeUtils.isBooleanOrNull)}
    />),
    renderDesigner: dn =>
        <div>
            {NodeUtils.designEntityBase(dn, { isCreable: true, isFindable: true, isViewable: false, showAutoComplete: false, showMove: true })}
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.avoidFieldSet)} type="boolean" defaultValue={false} allowsExpression={false} />
        </div>
});

export interface EntityTabRepeaterNode extends EntityListBaseNode {
    kind: "EntityTabRepeater",
    avoidFieldSet?: ExpressionOrValue<boolean>;
}

NodeUtils.register<EntityTabRepeaterNode>({
    kind: "EntityTabRepeater",
    group: "Collection",
    order: 5,
    isContainer: true,
    hasEntity: true,
    hasCollection: true,
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityTabRepeater", { ...cc.getEntityBasePropsEx(node, { showMove: true }), avoidFieldSet: node.avoidFieldSet }),
    render: (dn, ctx) => (<EntityTabRepeater
        {...NodeUtils.getEntityBaseProps(dn, ctx, { showMove: true }) }
        avoidFieldSet={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.avoidFieldSet, NodeUtils.isBooleanOrNull)} />),
    renderDesigner: dn =>
        <div>
            {NodeUtils.designEntityBase(dn, { isCreable: true, isFindable: true, isViewable: false, showAutoComplete: false, showMove: true })}
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.avoidFieldSet)} type="boolean" defaultValue={false} allowsExpression={false} />
        </div>
});

export interface EntityTableNode extends EntityListBaseNode {
    kind: "EntityTable",
    avoidFieldSet?: ExpressionOrValue<boolean>;
}

NodeUtils.register<EntityTableNode>({
    kind: "EntityTable",
    group: "Collection",
    order: 6,
    isContainer: true,
    hasEntity: true,
    hasCollection: true,
    validChild: "EntityTableColumn",
    validate: (dn, ctx) => NodeUtils.validateEntityBase(dn, ctx),
    renderTreeNode: NodeUtils.treeNodeKindField,
    renderCode: (node, cc) => cc.elementCode("EntityTable", {
        ...cc.getEntityBasePropsEx(node, { showMove: true, avoidGetComponent: true }),
        avoidFieldSet: node.avoidFieldSet,
        columns: ({ __code__: "EntityTable.typedColumns<YourEntityHere>(" + cc.stringifyObject(node.children.map((col: EntityTableColumnNode) => ({ __code__: NodeUtils.renderCode(col, cc) }))) + ")" })
    }),
    render: (dn, ctx) => (<EntityTable
        columns={dn.node.children.length == 0 ? undefined : dn.node.children.filter(c => NodeUtils.validate(dn.createChild(c), ctx) == null).map((col: EntityTableColumnNode) => NodeUtils.render(dn.createChild(col), ctx) as any)}
        {...NodeUtils.getEntityBaseProps(dn, ctx, { showMove: true, avoidGetComponent: true }) }
        avoidFieldSet={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.avoidFieldSet, NodeUtils.isBooleanOrNull)} />),

    renderDesigner: dn =>
        <div>
            {NodeUtils.designEntityBase(dn, { isCreable: true, isFindable: true, isViewable: false, showAutoComplete: false, showMove: true })}
            <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.avoidFieldSet)} type="boolean" defaultValue={false} allowsExpression={false} />
        </div>
});

export interface EntityTableColumnNode extends ContainerNode {
    kind: "EntityTableColumn",
    property?: string;
    header?: string;
    headerHtmlAttributes?: HtmlAttributesExpression,
    cellHtmlAttributes?: HtmlAttributesExpression,
}

NodeUtils.register<EntityTableColumnNode>({
    kind: "EntityTableColumn",
    group: null,
    order: null,
    isContainer: true,
    avoidHighlight: true,
    validParent: "EntityTable",
    validate: (dn) => dn.node.property ? NodeUtils.validateTableColumnProperty(dn) : NodeUtils.mandatory(dn, n => n.header),
    renderTreeNode: NodeUtils.treeNodeTableColumnProperty,
    renderCode: (node, cc) => cc.stringifyObject({
        property: node.property && { __code__: "a => a." + node.property },
        header: node.header,
        headerHtmlAttributes: node.headerHtmlAttributes,
        cellHtmlAttributes: node.cellHtmlAttributes,
        template: cc.getGetComponentEx(node, false)
    }),
    render: (dn, ctx) => ({
        property: dn.node.property && NodeUtils.asFieldFunction(dn.node.property),
        header: NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.header, NodeUtils.isStringOrNull),
        headerHtmlAttributes: toHtmlAttributes(ctx, dn.node.headerHtmlAttributes),
        cellHtmlAttributes: toHtmlAttributes(ctx, dn.node.cellHtmlAttributes),
        template: NodeUtils.getGetComponent(dn) 
    }) as EntityTableColumn<ModifiableEntity, any> as any, //HACK
    renderDesigner: dn => <div>
        <FieldComponent dn={dn} binding={Binding.create(dn.node, n => n.property)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.header)} type="string" defaultValue={null} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.headerHtmlAttributes)} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.cellHtmlAttributes)} />
    </div>
});

export interface SearchControlNode extends BaseNode {
    kind: "SearchControl",
    findOptions?: FindOptionsExpr;
    searchOnLoad?: ExpressionOrValue<boolean>;
    showHeader?: ExpressionOrValue<boolean>;
    showFilters?: ExpressionOrValue<boolean>;
    showFilterButton?: ExpressionOrValue<boolean>;
    showFooter?: ExpressionOrValue<boolean>;
    allowChangeColumns?: ExpressionOrValue<boolean>;
    create?: ExpressionOrValue<boolean>;
    navigate?: ExpressionOrValue<boolean>;
}

NodeUtils.register<SearchControlNode>({
    kind: "SearchControl",
    group: "Search",
    order: 1,
    validate: (dn, ctx) => NodeUtils.mandatory(dn, n => n.findOptions) || dn.node.findOptions && NodeUtils.validateFindOptions(dn.node.findOptions, ctx),
    renderTreeNode: dn => <span><small>SearchControl:</small> <strong>{dn.node.findOptions && dn.node.findOptions.queryName || " - " }</strong></span>,
    renderCode: (node, cc) => cc.elementCode("SearchControl", {
        findOptions: node.findOptions
    }),
    render: (dn, ctx) => <SearchControl
        findOptions={toFindOptions(ctx, dn.node.findOptions!)}
        searchOnLoad={NodeUtils.evaluateAndValidate(ctx, dn.node, f => f.searchOnLoad, NodeUtils.isBooleanOrNull)}
        showFilters={NodeUtils.evaluateAndValidate(ctx, dn.node, f => f.showFilters, NodeUtils.isBooleanOrNull)}
        showFilterButton={NodeUtils.evaluateAndValidate(ctx, dn.node, f => f.showFilterButton, NodeUtils.isBooleanOrNull)}
        showFooter={NodeUtils.evaluateAndValidate(ctx, dn.node, f => f.showFooter, NodeUtils.isBooleanOrNull)}
        allowChangeColumns={NodeUtils.evaluateAndValidate(ctx, dn.node, f => f.allowChangeColumns, NodeUtils.isBooleanOrNull)}
        create={NodeUtils.evaluateAndValidate(ctx, dn.node, f => f.create, NodeUtils.isBooleanOrNull)}
        navigate={NodeUtils.evaluateAndValidate(ctx, dn.node, f => f.navigate, NodeUtils.isBooleanOrNull)}
    />,
    renderDesigner: dn => <div>
        <FindOptionsLine dn={dn} binding={Binding.create(dn.node, a => a.findOptions)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.searchOnLoad)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.showHeader)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.showFilters)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.showFilterButton)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.showFooter)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.allowChangeColumns)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.create)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, f => f.navigate)} type="boolean" defaultValue={null} />
    </div>
});

export interface ValueSearchControlLineNode extends BaseNode {
    kind: "ValueSearchControlLine",
    findOptions?: FindOptionsExpr;
    valueToken?: string;
    labelText?: ExpressionOrValue<string>;
    labelHtmlAttributes?: HtmlAttributesExpression;
    isBadge?: ExpressionOrValue<boolean>;
    isLink?: ExpressionOrValue<boolean>;
    isFormControl?: ExpressionOrValue<boolean>;
    findButton?: ExpressionOrValue<boolean>;
    viewEntityButton?: ExpressionOrValue<boolean>;
    formGroupHtmlAttributes?: HtmlAttributesExpression;
}

NodeUtils.register<ValueSearchControlLineNode>({
    kind: "ValueSearchControlLine",
    group: "Search",
    order: 1,
    validate: (dn, ctx) =>
        (!dn.node.findOptions && !dn.node.valueToken && DynamicViewValidationMessage.Member0IsMandatoryFor1.niceToString("findOptions (or valueToken)", dn.node.kind)) ||
        (dn.node.findOptions ? NodeUtils.validateFindOptions(dn.node.findOptions, ctx) : undefined) ||
        (dn.node.findOptions && dn.node.valueToken && NodeUtils.validateAggregate(dn.node.valueToken))
        ,
    renderTreeNode: dn => <span><small>ValueSearchControlLine:</small> <strong>{
        dn.node.valueToken ? dn.node.valueToken :
            dn.node.findOptions ? dn.node.findOptions.queryName : " - "
    }</strong></span>,
    renderCode: (node, cc) => cc.elementCode("ValueSearchControlLine", {
        ctx: cc.subCtxCode(),
        findOptions: node.findOptions,
        valueToken: node.valueToken,
        labelText: node.labelText,
        isBadge: node.isBadge,
        isLink: node.isLink,
        isFormControl: node.isFormControl,
        findButton: node.findButton,
        viewEntityButton: node.viewEntityButton,
        labelHtmlAttributes: node.labelHtmlAttributes,
        formGroupHtmlAttributes: node.formGroupHtmlAttributes,
    }),
    render: (dn, ctx) => <ValueSearchControlLine ctx={ctx}
        findOptions={dn.node.findOptions && toFindOptions(ctx, dn.node.findOptions!)}
        valueToken={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.valueToken, NodeUtils.isStringOrNull)}
        labelText={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.labelText, NodeUtils.isStringOrNull)}
        isBadge={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.isBadge, NodeUtils.isBooleanOrNull)}
        isLink={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.isLink, NodeUtils.isBooleanOrNull)}
        isFormControl={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.isFormControl, NodeUtils.isBooleanOrNull)}
        findButton={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.findButton, NodeUtils.isBooleanOrNull)}
        viewEntityButton={NodeUtils.evaluateAndValidate(ctx, dn.node, n => n.viewEntityButton, NodeUtils.isBooleanOrNull)}
        labelHtmlAttributes={toHtmlAttributes(ctx, dn.node.labelHtmlAttributes)}
        formGroupHtmlAttributes={toHtmlAttributes(ctx, dn.node.formGroupHtmlAttributes)}
        />,
    renderDesigner: dn => <div>
        <QueryTokenLine dn={dn} binding={Binding.create(dn.node, a => a.valueToken)} queryKey={dn.node.findOptions && dn.node.findOptions.queryName || dn.route!.findRootType().name}
            subTokenOptions={SubTokensOptions.CanAggregate | SubTokensOptions.CanElement} />
        <FindOptionsLine dn={dn} binding={Binding.create(dn.node, a => a.findOptions)} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.labelHtmlAttributes)} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.labelText)} type="string" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.isBadge)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.isLink)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.isFormControl)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.findButton)} type="boolean" defaultValue={null} />
        <ExpressionOrValueComponent dn={dn} binding={Binding.create(dn.node, n => n.viewEntityButton)} type="boolean" defaultValue={null} />
        <HtmlAttributesLine dn={dn} binding={Binding.create(dn.node, n => n.formGroupHtmlAttributes)} />
    </div>
});

export namespace NodeConstructor {

    export function createDefaultNode(ti: TypeInfo) {
        return {
            kind: "Div",
            children: createSubChildren(PropertyRoute.root(ti))
        } as DivNode;
    }

    export function createEntityTableSubChildren(pr: PropertyRoute): BaseNode[] {

        const subMembers = pr.subMembers();

        return Dic.map(subMembers, (field, mi) => ({ kind: "EntityTableColumn", property: field, children: [] }) as BaseNode).filter(a => (a as any).property != "Id");
    }

    export function createSubChildren(pr: PropertyRoute): BaseNode[] {

        const subMembers = pr.subMembers();

        return Dic.map(subMembers, (field, mi) => appropiateComponent(mi, field)).filter(a => !!a).map(a => a!);
    }

    export const specificComponents: {
        [typeName: string]: (mi: MemberInfo, field: string) => BaseNode | undefined;
    } = {};

    export var appropiateComponent = (mi: MemberInfo, field: string): BaseNode | undefined => {
        if (mi.name == "Id" || mi.notVisible == true)
            return undefined;

        const tr = mi.type;
        const sc = specificComponents[tr.name];
        if (sc) {
            const result = sc(mi, field);
            if (result)
                return result;
        }

        const tis = getTypeInfos(tr);
        const ti = tis.firstOrNull();

        if (tr.isCollection) {
            if (tr.name == "[ALL]")
                return { kind: "EntityStrip", field, children: [] } as EntityStripNode;
            else if (tr.isEmbedded || ti!.entityKind == "Part" || ti!.entityKind == "SharedPart")
                return { kind: "EntityTable", field, children: [] } as EntityTableNode;
            else if (ti!.isLowPopulation)
                return { kind: "EntityCheckboxList", field, children: [] } as EntityCheckboxListNode;
            else
                return { kind: "EntityStrip", field, children: [] } as EntityStripNode;
        }

        if (tr.name == "[ALL]")
            return { kind: "EntityLine", field, children: [] } as EntityLineNode;

        if (ti) {
            if (ti.kind == "Enum")
                return { kind: "ValueLine", field } as ValueLineNode;

            if (ti.entityKind == "Part" || ti.entityKind == "SharedPart")
                return { kind: "EntityDetail", field, children: [] } as EntityDetailNode;

            if (ti.isLowPopulation)
                return { kind: "EntityCombo", field, children: [] } as EntityComboNode;

            return { kind: "EntityLine", field, children: [] } as EntityLineNode;
        }

        if (tr.isEmbedded)
            return { kind: "EntityDetail", field, children: [] } as EntityDetailNode;

        if (ValueLine.getValueLineType(tr) != undefined)
            return { kind: "ValueLine", field } as ValueLineNode;

        return undefined;
    }
}

