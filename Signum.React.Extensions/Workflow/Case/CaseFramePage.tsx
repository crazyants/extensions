﻿
import * as React from 'react'
import { Dic } from '../../../../Framework/Signum.React/Scripts/Globals'
import { TypeContext, StyleOptions, EntityFrame  } from '../../../../Framework/Signum.React/Scripts/TypeContext'
import { TypeInfo, getTypeInfo, parseId, GraphExplorer, PropertyRoute, ReadonlyBinding, } from '../../../../Framework/Signum.React/Scripts/Reflection'
import * as Navigator from '../../../../Framework/Signum.React/Scripts/Navigator'
import * as Operations from '../../../../Framework/Signum.React/Scripts/Operations'
import { EntityPack, Entity, Lite, JavascriptMessage, entityInfo, getToString, toLite } from '../../../../Framework/Signum.React/Scripts/Signum.Entities'
import { renderWidgets, renderEmbeddedWidgets, WidgetContext } from '../../../../Framework/Signum.React/Scripts/Frames/Widgets'
import ValidationErrors from '../../../../Framework/Signum.React/Scripts/Frames/ValidationErrors'
import ButtonBar from '../../../../Framework/Signum.React/Scripts/Frames/ButtonBar'
import { CaseActivityEntity, WorkflowEntity, ICaseMainEntity, CaseActivityOperation, WorkflowMainEntityStrategy } from '../Signum.Entities.Workflow'
import * as WorkflowClient from '../WorkflowClient'
import CaseFromSenderInfo from './CaseFromSenderInfo'
import CaseButtonBar from './CaseButtonBar'
import CaseFlowButton from './CaseFlowButton'
import InlineCaseTags from './InlineCaseTags'
import { RouteComponentProps } from "react-router";

import "../../../../Framework/Signum.React/Scripts/Frames/Frames.css"
import "./CaseAct.css"
import { IHasCaseActivity } from '../WorkflowClient';

interface CaseFramePageProps extends RouteComponentProps<{ workflowId: string; mainEntityStrategy: string; caseActivityId?: string }> {
}

interface CaseFramePageState {
    pack?: WorkflowClient.CaseEntityPack;
    getComponent?: (ctx: TypeContext<Entity>) => React.ReactElement<any>;
}

export default class CaseFramePage extends React.Component<CaseFramePageProps, CaseFramePageState> implements IHasCaseActivity {

    constructor(props: any) {
        super(props);
        this.state = this.calculateState(props);

    }

    getCaseActivity(): CaseActivityEntity | undefined {
        return this.state.pack && this.state.pack.activity;
    }

    componentWillMount() {
        this.load(this.props);
    }
    
    calculateState(props: CaseFramePageProps) {
        return { getComponent: undefined } as CaseFramePageState;
    }
    
    componentWillReceiveProps(newProps: CaseFramePageProps) {
        this.setState(this.calculateState(newProps), () => {
            this.load(newProps);
        });
    }

    componentWillUnmount() {
        Navigator.setTitle();
    }

    load(props: CaseFramePageProps) {
        this.loadEntity(props)
            .then(() => Navigator.setTitle(this.state.pack!.activity.case.toStr))
            .then(() => this.loadComponent())
            .done();
    }

    loadEntity(props: CaseFramePageProps): Promise<void> {

        const routeParams = props.match.params;
        if (routeParams.caseActivityId) {
            return WorkflowClient.API.fetchActivityForViewing({ EntityType: CaseActivityEntity.typeName, id: routeParams.caseActivityId })
                .then(pack => this.setState({ pack: pack  }));

        } else if (routeParams.workflowId) {
            const ti = getTypeInfo(WorkflowEntity);
            return WorkflowClient.createNewCase(parseId(ti, routeParams.workflowId), (routeParams.mainEntityStrategy as WorkflowMainEntityStrategy))
                .then(pack => {
                    if (!pack)
                        Navigator.history.goBack();
                    else
                        this.setState({ pack });
                });        

        } else
            throw new Error("No caseActivityId or workflowId set");
    }

    loadComponent(): Promise<void> {
        if (!this.state.pack)
            return Promise.resolve(undefined);

        const a = this.state.pack!.activity;

        return Navigator.viewDispatcher.getViewPromise(a.case.mainEntity, a.workflowActivity!.viewName || undefined).promise
            .then(c => this.setState({ getComponent: c }));
    }

    onClose() {
        Navigator.history.push(WorkflowClient.getDefaultInboxUrl());
    }

    entityComponent: React.Component<any, any>;

    setComponent(c: React.Component<any, any>) {
        if (c && this.entityComponent != c) {
            this.entityComponent = c;
            this.forceUpdate();
        }
    }

    render() {
        
        if (!this.state.pack) {
            return (
                <div className="normal-control">
                    {this.renderTitle() }
                </div>
            );
        }

        var pack = this.state.pack;
        
        const activityFrame: EntityFrame<CaseActivityEntity> = {
            frameComponent: this,
            entityComponent: this.entityComponent,
            onReload: newPack => {
                if (pack.activity.isNew && !newPack.entity.isNew)
                    Navigator.history.push("~/workflow/activity/" + newPack.entity.id);
                else {
                    pack.activity = newPack.entity;
                    pack.canExecuteActivity = newPack.canExecute;
                    this.forceUpdate();
                }
            },
            onClose: () => this.onClose(),
            revalidate: () => { throw new Error("Not implemented"); },
            setError: (ms, initialPrefix) => {
                GraphExplorer.setModelState(pack.activity, ms, initialPrefix || "");
                this.forceUpdate()
            },
        };

     
        var activityPack = { entity: pack.activity, canExecute: pack.canExecuteActivity };
      
        return (
            <div className="normal-control">
                {this.renderTitle()}     
                <CaseFromSenderInfo current={pack.activity} />  
                {!pack.activity.case.isNew && <div className="inline-tags"> <InlineCaseTags case={toLite(pack.activity.case)} /></div>}
                <div className="sf-main-control form-horizontal" data-test-ticks={new Date().valueOf() } data-activity-entity={entityInfo(pack.activity) }>
                    {this.renderMainEntity() }
                </div>
                {this.entityComponent && <CaseButtonBar frame={activityFrame} pack={activityPack} />}
            </div>
        );
    }

    renderTitle() {

        if (!this.state.pack)
            return <h3>{JavascriptMessage.loading.niceToString() }</h3>;

        const activity = this.state.pack.activity;

        return (
            <h3>
                {!activity.case.isNew && <CaseFlowButton caseActivity={this.state.pack.activity} />}
                <span className="sf-entity-title">{ getToString(activity) }</span>
                <br/>
                <small className="sf-type-nice-name">{Navigator.getTypeTitle(activity, undefined)}</small>
            </h3>
        );
    }


    validationErrors?: ValidationErrors | null;

    getMainTypeInfo(): TypeInfo {
        return getTypeInfo(this.state.pack!.activity.case.mainEntity.Type);
    }

    renderMainEntity() {

        var pack = this.state.pack!;
        var mainEntity = pack.activity.case.mainEntity;
        const mainFrame: EntityFrame<ICaseMainEntity> = {
            frameComponent: this,
            entityComponent: this.entityComponent,
            onReload: newPack => {
                pack.activity.case.mainEntity = newPack.entity;
                pack.canExecuteMainEntity = newPack.canExecute;
                this.forceUpdate();
            },
            onClose: () => this.onClose(),
            revalidate: () => this.validationErrors && this.validationErrors.forceUpdate(),
            setError: (ms, initialPrefix) => {
                GraphExplorer.setModelState(mainEntity, ms, initialPrefix || "");
                this.forceUpdate()
            },
        };

        var ti = this.getMainTypeInfo();

        const styleOptions: StyleOptions = {
            readOnly: Navigator.isReadOnly(ti) || Boolean(pack.activity.doneDate),
            frame: mainFrame
        };

        const ctx = new TypeContext<ICaseMainEntity>(undefined, styleOptions, PropertyRoute.root(ti), new ReadonlyBinding(mainEntity, ""));

        var { activity, canExecuteActivity, canExecuteMainEntity, ...extension } = this.state.pack!;

        var mainPack = { entity: mainEntity, canExecute: pack.canExecuteMainEntity, ...extension };

        const wc: WidgetContext<ICaseMainEntity> = {
            ctx: ctx,
            pack: mainPack,
        };

        return (
            <div className="sf-main-entity case-main-entity" data-main-entity={entityInfo(mainEntity) }>
                { renderWidgets(wc) }
                { this.entityComponent && !mainEntity.isNew && !pack.activity.doneBy ? <ButtonBar frame={mainFrame} pack={mainPack} /> : <br /> }
                <ValidationErrors entity={mainEntity} ref={ve => this.validationErrors = ve}/>
                {this.state.getComponent && React.cloneElement(this.state.getComponent(ctx), { ref: (c: React.Component<any, any>) => this.setComponent(c) })}
            </div>
        );
    }
   
}