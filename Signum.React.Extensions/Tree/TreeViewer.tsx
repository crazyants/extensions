﻿import * as React from 'react'
import { MenuItem, DropdownButton } from 'react-bootstrap'
import { API, TreeNode, TreeNodeState, fixState } from './TreeClient'
import { Dic, classes, DomUtils } from '../../../Framework/Signum.React/Scripts/Globals'
import * as Navigator from '../../../Framework/Signum.React/Scripts/Navigator'
import * as Finder from '../../../Framework/Signum.React/Scripts/Finder'
import ContextMenu from '../../../Framework/Signum.React/Scripts/SearchControl/ContextMenu'
import { ContextMenuPosition } from '../../../Framework/Signum.React/Scripts/SearchControl/ContextMenu'
import * as Operations from '../../../Framework/Signum.React/Scripts/Operations'
import * as EntityOperations from '../../../Framework/Signum.React/Scripts/Operations/EntityOperations'
import { SearchMessage, JavascriptMessage, EntityControlMessage, toLite, liteKey, ExecuteSymbol, ConstructSymbol_From, ConstructSymbol_Simple, DeleteSymbol, OperationMessage } from '../../../Framework/Signum.React/Scripts/Signum.Entities'
import { TreeViewerMessage, TreeEntity, TreeOperation, MoveTreeModel } from './Signum.Entities.Tree'
import * as TreeClient from './TreeClient'
import { FilterOptionParsed, QueryDescription, FilterRequest, SubTokensOptions, FilterOption } from "../../../Framework/Signum.React/Scripts/FindOptions";
import FilterBuilder from "../../../Framework/Signum.React/Scripts/SearchControl/FilterBuilder";
import { ISimpleFilterBuilder } from "../../../Framework/Signum.React/Scripts/Search";
import { is } from "../../../Framework/Signum.React/Scripts/Signum.Entities";
import MessageModal from "../../../Framework/Signum.React/Scripts/Modals/MessageModal";
import { ContextualItemsContext, renderContextualItems } from "../../../Framework/Signum.React/Scripts/SearchControl/ContextualItems";
import { Entity } from "../../../Framework/Signum.React/Scripts/Signum.Entities";
import { Lite } from "../../../Framework/Signum.React/Scripts/Signum.Entities";
import { DisabledMixin } from "../Basics/Signum.Entities.Basics";
import { getMixin } from "../../../Framework/Signum.React/Scripts/Signum.Entities";
import { tryGetMixin } from "../../../Framework/Signum.React/Scripts/Signum.Entities";

import "./TreeViewer.css"

interface TreeViewerProps {
    typeName: string;
    showContextMenu?: boolean | "Basic";
    allowMove?: boolean;
    avoidChangeUrl?: boolean;
    onDoubleClick?: (selectedNode: TreeNode, e: React.MouseEvent<any>) => void;
    onSelectedNode?: (selectedNode: TreeNode | undefined) => void;
    onSearch?: () => void;
    filterOptions: FilterOption[];
    initialShowFilters?: boolean;
}

export type DraggedPosition = "Top" | "Bottom" | "Middle";

export interface DraggedOver {
    node: TreeNode;
    position: DraggedPosition;
}

interface TreeViewerState {
    treeNodes?: Array<TreeNode>;
    selectedNode?: TreeNode;
    filterOptions: FilterOptionParsed[];
    queryDescription?: QueryDescription;
    simpleFilterBuilder?: React.ReactElement<any>;
    showFilters?: boolean;

    draggedNode?: TreeNode;
    draggedKind?: "Move" | "Copy";
    draggedOver?: DraggedOver;

    currentMenuItems?: React.ReactElement<any>[];
    contextualMenu?: {
        position: ContextMenuPosition;
    };
}



export class TreeViewer extends React.Component<TreeViewerProps, TreeViewerState>{

    constructor(props: TreeViewerProps) {
        super(props);
        this.state = {
            filterOptions: [],
            showFilters: props.initialShowFilters
        };
    }

    selectNode(node: TreeNode | undefined) {

        this.setState({ selectedNode: node });
        if (this.props.onSelectedNode)
            this.props.onSelectedNode(node);
    }

    componentWillMount() {
        this.initilize(this.props.typeName, this.props.filterOptions);
    }

    componentWillReceiveProps(newProps: TreeViewerProps) {
        var path = TreeClient.treePath(newProps.typeName, newProps.filterOptions);
        if (path == TreeClient.treePath(this.props.typeName, this.props.filterOptions))
            return;

        if (this.state.filterOptions && this.state.queryDescription) {
            if (path == TreeClient.treePath(this.props.typeName, Finder.toFilterOptions(this.state.filterOptions)))
                return;
        }

        this.state = { filterOptions: [], showFilters: newProps.initialShowFilters };
        this.forceUpdate();

        this.initilize(newProps.typeName, newProps.filterOptions);
    }

    initilize(typeName: string, filterOptions: FilterOption[]) {

        Finder.getQueryDescription(typeName)
            .then(qd => {
                Finder.parseFilterOptions(filterOptions, qd).then(fop => {
                    this.setState({ filterOptions: fop }, () => {
                        const qs = Finder.getSettings(typeName);
                        const sfb = qs && qs.simpleFilterBuilder && qs.simpleFilterBuilder(qd, this.state.filterOptions);
                        this.setState({ queryDescription: qd, simpleFilterBuilder: sfb });
                        if (sfb)
                            this.setState({ showFilters: false });

                        this.search(true);
                    });
                });
            })
            .done();
    }

    handleFullScreenClick = (ev: React.MouseEvent<any>) => {

        ev.preventDefault();

        const path = this.getCurrentUrl();

        if (ev.ctrlKey || ev.button == 1)
            window.open(path);
        else
            Navigator.history.push(path);
    };

    getCurrentUrl() {
        return TreeClient.treePath(this.props.typeName, Finder.toFilterOptions(this.state.filterOptions));
    }



    handleNodeIconClick = (n: TreeNode) => {
        if (n.nodeState == "Collapsed" || n.nodeState == "Filtered") {
            n.nodeState = "Expanded";
            this.search(false);
        }
        else if (n.nodeState == "Expanded") {
            n.nodeState = "Collapsed";
            this.forceUpdate();
        }
    }

    handleNodeTextClick = (n: TreeNode) => {
        this.selectNode(n);
    }

    handleNodeTextDoubleClick = (n: TreeNode, e: React.MouseEvent<any>) => {
        if (this.props.onDoubleClick)
            this.props.onDoubleClick(n, e);
        else
            this.handleNavigate();
    }

    handleNavigate = () => {
        const node = this.state.selectedNode!;
        Navigator.navigate(node.lite)
            .then(() => this.search(false))
            .done();
    }

    treeContainer: HTMLElement;

    render() {
        return (
            <div>
                {this.renderSearch()}
                <br />
                {this.renderToolbar()}
                <br />
                <div className="tree-container" ref={(t) => this.treeContainer = t!} >
                    <ul>
                        {!this.state.treeNodes ? JavascriptMessage.loading.niceToString() :
                            this.state.treeNodes.map((node, i) =>
                                <TreeNodeControl key={i} treeViewer={this} treeNode={node} dropDisabled={node == this.state.draggedNode} />)}
                    </ul>
                </div>
                {this.state.contextualMenu && this.renderContextualMenu()}
            </div>
        );
    }

    handleNodeTextContextMenu = (n: TreeNode, e: React.MouseEvent<any>) => {
        e.preventDefault();
        e.stopPropagation();

        this.setState({
            selectedNode: n,
            contextualMenu: {
                position: ContextMenu.getPosition(e, this.treeContainer)
            }
        }, () => this.loadMenuItems());
    }

    loadMenuItems() {
        if (this.props.showContextMenu == "Basic")
            this.setState({ currentMenuItems: [] });
        else {
            const options: ContextualItemsContext<Entity> = {
                lites: [this.state.selectedNode!.lite],
                queryDescription: this.state.queryDescription!,
                markRows: () => { this.search(false); },
                container: this,
            };

            renderContextualItems(options)
                .then(menuItems => this.setState({ currentMenuItems: menuItems }))
                .done();
        }
    }

    handleContextOnHide = () => {
        this.setState({ contextualMenu: undefined, currentMenuItems: undefined });
    }

    renderContextualMenu() {
        const cm = this.state.contextualMenu!;
        if (!this.state.selectedNode)
            return null;

        return (
            <ContextMenu position={cm.position} onHide={this.handleContextOnHide}>
                {this.renderMenuItems().map((e, i) => React.cloneElement(e, { key: i }))}
            </ContextMenu>
        );
    }

    renderMenuItems(): React.ReactElement<any>[] {

        var menuItems = [
            Navigator.isNavigable(this.props.typeName, undefined, true) && <MenuItem onClick={this.handleNavigate} bsClass="danger" > <i className="fa fa-arrow-right" aria-hidden="true"></i>&nbsp;{EntityControlMessage.View.niceToString()}</MenuItem >,
            Operations.isOperationAllowed(TreeOperation.CreateChild) && <MenuItem onClick={this.handleAddChildren}><i className="fa fa-caret-square-o-right" aria-hidden="true"></i>&nbsp;{TreeViewerMessage.AddChild.niceToString()}</MenuItem>,
            Operations.isOperationAllowed(TreeOperation.CreateNextSibling) && <MenuItem onClick={this.handleAddSibling}><i className="fa fa-caret-square-o-down" aria-hidden="true"></i>&nbsp;{TreeViewerMessage.AddSibling.niceToString()}</MenuItem>,
        ].filter(a => a != false) as React.ReactElement<any>[];

        if (this.state.currentMenuItems == undefined) {
            menuItems.push(<MenuItem header>{JavascriptMessage.loading.niceToString()}</MenuItem>);
        } else {
            if (menuItems.length && this.state.currentMenuItems.length)
                menuItems.push(<MenuItem divider />);

            menuItems.splice(menuItems.length, 0, ...this.state.currentMenuItems);
        }

        return menuItems;
    }

    handleSearchSubmit = (e: React.FormEvent<any>) => {
        e.preventDefault();
        e.stopPropagation();

        this.search(true);
    }


    search(clearExpanded: boolean) {
        this.getFilterOptionsWithSFB().then(filters => {

            let expandedNodes = clearExpanded || !this.state.treeNodes ? [] :
                this.state.treeNodes!.flatMap(allNodes).filter(a => a.nodeState == "Expanded").map(a => a.lite);

            const validFilters = filters.filter(fo => fo.token != undefined && fo.operation != undefined);

            const userFilters = validFilters.filter(fo => fo.frozen == false).map(fo => ({ token: fo.token!.fullKey, operation: fo.operation!, value: fo.value }) as FilterRequest);
            const frozenFilters = validFilters.filter(fo => fo.frozen == true).map(fo => ({ token: fo.token!.fullKey, operation: fo.operation!, value: fo.value }) as FilterRequest);

            const newLastFilters = JSON.stringify(userFilters);
            
            if (userFilters.length == 0 && frozenFilters.length == 0)
                userFilters.push({ token: "Entity.Level", operation: "EqualTo", value: 1 });

            return API.findNodes(this.props.typeName, { userFilters, frozenFilters, expandedNodes });
        })
            .then(nodes => {
                const selectedLite = this.state.selectedNode && this.state.selectedNode.lite;
                var newSeleted = selectedLite && nodes.filter(a => is(a.lite, selectedLite)).singleOrNull();
                this.setState({ treeNodes: nodes, selectedNode: newSeleted || undefined });

                if (this.props.onSearch)
                    this.props.onSearch();
            })
            .done();
    }

    renderSearch() {
        const s = this.state;

        const sfb = this.state.simpleFilterBuilder &&
            React.cloneElement(this.state.simpleFilterBuilder, { ref: (e: ISimpleFilterBuilder) => { this.simpleFilterBuilderInstance = e } });

        return (
            <form onSubmit={this.handleSearchSubmit}>
                {s.queryDescription && (s.showFilters ?
                    <FilterBuilder
                        queryDescription={s.queryDescription}
                        filterOptions={s.filterOptions}
                        subTokensOptions={SubTokensOptions.CanAnyAll} /> :
                    sfb && <div className="simple-filter-builder">{sfb}</div>)}
            </form>
        );
    }

    handleAddRoot = () => {
        Operations.API.construct(this.props.typeName, TreeOperation.CreateRoot)
            .then(ep => Navigator.view(ep, { requiresSaveOperation: true }))
            .then(te => {
                if (!te)
                    return;
                this.state.treeNodes!.push(toTreeNode(te));
                this.forceUpdate();
            })
            .done();
    }

    handleAddChildren = () => {
        var parent = this.state.selectedNode!;
        Operations.API.constructFromLite(parent.lite, TreeOperation.CreateChild)
            .then(ep => Navigator.view(ep, { requiresSaveOperation: true }))
            .then(te => {
                if (!te)
                    return;
                var newNode = toTreeNode(te);
                parent.loadedChildren.push(newNode);
                parent.childrenCount++;
                fixState(parent);
                this.selectNode(newNode);
            })
            .done();
    }

    handleAddSibling = () => {

        var sibling = this.state.selectedNode!;

        Operations.API.constructFromLite(sibling.lite, TreeOperation.CreateNextSibling)
            .then(ep => Navigator.view(ep, { requiresSaveOperation: true }))
            .then(te => {
                if (!te)
                    return;
                const newNode = toTreeNode(te);
                const parent = this.findParent(sibling);
                const array = parent ? parent.loadedChildren : this.state.treeNodes!;
                array.insertAt(array.indexOf(sibling) + 1, newNode);
                this.selectNode(newNode);
            })
            .done();
    }

    findParent(childNode: TreeNode) {
        return this.state.treeNodes!.flatMap(allNodes).filter(n => n.loadedChildren.contains(childNode)).singleOrNull();
    }
    
    simpleFilterBuilderInstance?: ISimpleFilterBuilder;
    getFilterOptionsWithSFB(): Promise<FilterOptionParsed[]> {

        const fos = this.state.filterOptions;
        const qd = this.state.queryDescription!;

        if (this.simpleFilterBuilderInstance == undefined)
            return Promise.resolve(fos);

        if (!this.simpleFilterBuilderInstance.getFilters)
            throw new Error("The simple filter builder should have a method with signature: 'getFilters(): FilterOption[]'");

        var filters = this.simpleFilterBuilderInstance.getFilters();

        return Finder.parseFilterOptions(filters, qd).then(newFos => {
            this.setState({ filterOptions: newFos });

            return newFos;
        });
    }

    renderToolbar() {
        const s = this.state;
        const selected = s.selectedNode;
        const menuItems = this.renderMenuItems();

        return (
            <div className="btn-toolbar">
                <a className={"sf-query-button sf-filters-header btn btn-default" + (s.showFilters ? " active" : "")}
                    onClick={this.handleToggleFilters}
                    title={s.showFilters ? JavascriptMessage.hideFilters.niceToString() : JavascriptMessage.showFilters.niceToString()}><span className="glyphicon glyphicon glyphicon-filter"></span></a>
                <button className="btn btn-primary" onClick={this.handleSearchSubmit}>{JavascriptMessage.search.niceToString()}</button>
                {Operations.isOperationAllowed(TreeOperation.CreateRoot) && <button className= "btn btn-default" onClick= { this.handleAddRoot } disabled= { s.treeNodes == null } > <i className="fa fa-star" aria-hidden="true"></i>&nbsp;{TreeViewerMessage.AddRoot.niceToString()}</button>}
                <DropdownButton id="selectedButton"
                    className="sf-query-button sf-tm-selected"
                    title={`${JavascriptMessage.Selected.niceToString()} (${selected && selected.lite.toStr || TreeViewerMessage.AddRoot.niceToString()})`}
                    onToggle={this.handleSelectedToggle}
                    disabled={selected == undefined}>
                    {menuItems == undefined ? <MenuItem className="sf-tm-selected-loading">{JavascriptMessage.loading.niceToString()}</MenuItem> :
                        menuItems.length == 0 ? <MenuItem className="sf-search-ctxitem-no-results">{JavascriptMessage.noActionsFound.niceToString()}</MenuItem> :
                            menuItems.map((e, i) => React.cloneElement(e, { key: i }))}
                </DropdownButton>
                <button className="btn btn-default" onClick={this.handleExplore} ><i className="glyphicon glyphicon-search"></i> &nbsp; {SearchMessage.Explore.niceToString()}</button>
            </div>
        );
    }

    handleSelectedToggle = (isOpen: boolean) => {

        if (isOpen && this.state.currentMenuItems == undefined)
            this.loadMenuItems();
    }

    handleExplore = (e: React.MouseEvent<any>) => {
        var path = Finder.findOptionsPath({
            queryName: this.props.typeName,
            filterOptions: Finder.toFilterOptions(this.state.filterOptions),
        });

        if (this.props.avoidChangeUrl)
            window.open(Navigator.toAbsoluteUrl(path));
        else
            Navigator.pushOrOpenInTab(path, e);
    }

    handleToggleFilters = () => {

        this.getFilterOptionsWithSFB().then(() => {
            this.simpleFilterBuilderInstance = undefined;
            this.setState({ simpleFilterBuilder: undefined, showFilters: !this.state.showFilters });
        }).done();
    }


    handleDragStart = (node: TreeNode, e: React.DragEvent<any>) => {
        e.dataTransfer.setData('text', "start"); //cannot be empty string

        var isCopy = e.ctrlKey || e.shiftKey || e.altKey;
        e.dataTransfer.effectAllowed = isCopy ? "copy" : "move";
        this.setState({ draggedNode: node, draggedKind: isCopy? "Copy":  "Move" });
    }


    handleDragOver = (node: TreeNode, e: React.DragEvent<any>) => {
        e.preventDefault();
        const de = e.nativeEvent as DragEvent;
        const span = e.currentTarget as HTMLElement;
        const newPosition = this.getOffset(de.pageY, span.getBoundingClientRect(), 7);

        const s = this.state;

        if (s.draggedOver == null ||
            s.draggedOver.node != node ||
            s.draggedOver.position != newPosition) {

            this.setState({
                draggedOver: {
                    node: node,
                    position: newPosition,
                }
            });
        }
    }

    getOffset(pageY: number, rect: ClientRect, margin: number): DraggedPosition {

        const height = Math.round(rect.height / 5) * 5;
        const offsetY = pageY - rect.top;

        if (offsetY < margin)
            return "Top";

        if (offsetY > (height - margin))
            return "Bottom";

        return "Middle";
    }

    handleDragEnd = (node: TreeNode, e: React.DragEvent<any>) => {
        this.setState({ draggedNode: undefined, draggedOver: undefined, draggedKind: undefined });
    }

    handleDrop = (node: TreeNode, e: React.DragEvent<any>) => {
        const dragged = this.state.draggedNode!;
        const over = this.state.draggedOver!;

        if (dragged == over.node)
            return;
        
        var nodeParent = this.findParent(over.node);
        const ts = TreeClient.settings[this.props.typeName];
        if (ts && ts.dragTargetIsValid)
            ts.dragTargetIsValid(dragged, over.position == "Middle" ? over.node : nodeParent)
                .then(valid => {
                    if (!valid)
                        return;

                    this.moveOrCopyOperation(nodeParent, dragged, over);

                }).done()
        else
            this.moveOrCopyOperation(nodeParent, dragged, over);
    }

    moveOrCopyOperation(nodeParent: TreeNode | null, dragged: TreeNode, over: DraggedOver) {

        var partial: Partial<MoveTreeModel> =
            over.position == "Middle" ? { newParent: over.node.lite, insertPlace: "LastNode" } :
                over.position == "Top" ? { newParent: nodeParent && nodeParent.lite, insertPlace: "Before", sibling: over.node.lite } :
                    over.position == "Bottom" ? { newParent: nodeParent && nodeParent.lite, insertPlace: "After", sibling: over.node.lite } :
                        {};

        var toExpand = over.position == "Middle" ? over.node : nodeParent;

        if (this.state.draggedKind == "Move") {
            const treeModel = MoveTreeModel.New(partial);
            Operations.API.executeLite(dragged.lite, TreeOperation.Move, treeModel).then(() =>
                
                this.setState({ draggedNode: undefined, draggedOver: undefined, draggedKind: undefined, selectedNode: dragged }, () => {
                    if (toExpand)
                        toExpand.nodeState = "Expanded";

                    this.search(false);
                })
            ).done();

        } else {
            const s = TreeClient.settings[this.props.typeName];
            var promise = s && s.createCopyModel ? s.createCopyModel(dragged.lite, partial) : Promise.resolve(MoveTreeModel.New(partial));
            promise.then(treeModel => treeModel &&
                Operations.API.constructFromLite(dragged.lite, TreeOperation.Copy, treeModel).then(() =>
                    this.setState({ draggedNode: undefined, draggedOver: undefined, draggedKind: undefined, selectedNode: dragged }, () => {
                        if (toExpand)
                            toExpand.nodeState = "Expanded";

                        this.search(false);
                    })
                ))
                .done();
        };
    }
}


function allNodes(node: TreeNode): TreeNode[] {
    return [node].concat(node.loadedChildren ? node.loadedChildren.flatMap(allNodes) : []);
}

function toTreeNode(treeEntity: TreeEntity): TreeNode {

    var dm = tryGetMixin(treeEntity, DisabledMixin);
    return {
        lite: toLite(treeEntity),
        name: treeEntity.name!,
        childrenCount: 0,
        disabled: dm != null && Boolean(dm.isDisabled),
        level: 0,
        loadedChildren: [],
        nodeState: "Leaf"
    };
}

interface TreeNodeControlProps {
    treeViewer: TreeViewer;
    treeNode: TreeNode;
    dropDisabled: boolean;
}

class TreeNodeControl extends React.Component<TreeNodeControlProps> {

    renderIcon(nodeState: TreeNodeState) {

        var node = this.props.treeNode;
        const tv = this.props.treeViewer;
        switch (nodeState) {
            case "Collapsed": return <span onClick={() => tv.handleNodeIconClick(node)} className = "tree-icon fa fa-plus-square-o" />;
            case "Expanded": return <span onClick={() => tv.handleNodeIconClick(node)} className="tree-icon fa fa-minus-square-o" />;
            case "Filtered": return (
                <span onClick={() => tv.handleNodeIconClick(node)} className = "tree-icon fa-stack fa-sm" >
                    <i className="fa fa-square-o fa-stack-2x"></i>
                    <i className="fa fa-filter fa-stack-1x"></i>
                </span>);
            default: return <span className="place-holder" />;
        }
    }

    render(): React.ReactElement<any> {

        var node = this.props.treeNode;
        const tv = this.props.treeViewer;
        return (
            <li>
                <div draggable={tv.props.allowMove}
                    onDragStart={de => tv.handleDragStart(node, de)}
                    onDragEnter={de => tv.handleDragOver(node, de)}
                    onDragOver={de => tv.handleDragOver(node, de)}
                    onDragEnd={de => tv.handleDragEnd(node, de)}
                    onDrop={this.props.dropDisabled ? undefined: de => tv.handleDrop(node, de)}
                    style={this.getDragAndDropStyle(node)}>
                    {this.renderIcon(node.nodeState)}

                    <span className={classes("tree-label", node == tv.state.selectedNode && "tree-selected", node.disabled && "tree-disabled")}
                        onDoubleClick={e => tv.handleNodeTextDoubleClick(node, e)}
                        onClick={() => tv.handleNodeTextClick(node)}
                        onContextMenu={tv.props.showContextMenu != false ? e => tv.handleNodeTextContextMenu(node, e) : undefined}>
                        {node.name}
                    </span>
                </div>

                {node.loadedChildren.length > 0 && (node.nodeState == "Expanded" || node.nodeState == "Filtered") &&
                    <ul>
                    {node.loadedChildren.map((n, i) =>
                        <TreeNodeControl key={i} treeViewer={tv} treeNode={n} dropDisabled={this.props.dropDisabled || n == tv.state.draggedNode} />)}
                    </ul>
                }
            </li>
        );
    }

    getDragAndDropStyle(node: TreeNode): React.CSSProperties | undefined {
        const s = this.props.treeViewer.state;

        if (s.draggedNode == undefined)
            return undefined;

        if (node == s.draggedNode)
            return { opacity: 0.5 };

        const over = s.draggedOver;

        if (over && node == over.node) {

            const color = this.props.dropDisabled ? "rgb(193, 0, 0)" :
                "rgb(10, 162, 0)";

            if (over.position == "Top")
                return { borderTop: "2px dashed " + color };
            if (over.position == "Bottom")
                return { borderBottom: "2px solid " + color };
            else
                return { backgroundColor: color.replace("(", "a(").replace(")", ", 0.2)") };
        }

        return undefined;
    }
}
