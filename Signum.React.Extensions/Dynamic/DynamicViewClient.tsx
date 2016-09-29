
import * as React from 'react'
import { Route } from 'react-router'
import { ajaxPost, ajaxGet } from '../../../Framework/Signum.React/Scripts/Services';
import { EntitySettings, ViewPromise } from '../../../Framework/Signum.React/Scripts/Navigator'
import * as Navigator from '../../../Framework/Signum.React/Scripts/Navigator'
import { EntityOperationSettings } from '../../../Framework/Signum.React/Scripts/Operations'
import * as Operations from '../../../Framework/Signum.React/Scripts/Operations'
import { TypeContext } from '../../../Framework/Signum.React/Scripts/TypeContext'
import { isTypeEntity, getTypeInfo, } from '../../../Framework/Signum.React/Scripts/Reflection'
import { Entity } from '../../../Framework/Signum.React/Scripts/Signum.Entities'
import { TypeEntity } from '../../../Framework/Signum.React/Scripts/Signum.Entities.Basics'
import * as Constructor from '../../../Framework/Signum.React/Scripts/Constructor'
import SelectorModal from '../../../Framework/Signum.React/Scripts/SelectorModal'

import { ValueLine, EntityLine, EntityCombo, EntityList, EntityDetail, EntityStrip, EntityRepeater } from '../../../Framework/Signum.React/Scripts/Lines'
import { DynamicViewEntity, DynamicViewSelectorEntity, DynamicViewMessage } from './Signum.Entities.Dynamic'
import { BaseNode, NodeConstructor } from './View/Nodes'
import { DynamicViewComponentProps } from './View/DynamicViewComponent'
import { AuthInfo } from './View/AuthInfo'

export function start(options: { routes: JSX.Element[] }) {

    Navigator.addSettings(new EntitySettings(DynamicViewEntity, w => new ViewPromise(resolve => require(['./View/DynamicViewEntity'], resolve))));
    Navigator.addSettings(new EntitySettings(DynamicViewSelectorEntity, w => new ViewPromise(resolve => require(['./View/DynamicViewSelector'], resolve))));

    Navigator.setFallbackViewPromise(mod => {
        if (!isTypeEntity(mod.Type))
            return new ViewPromise(resolve => require(['../../../Framework/Signum.React/Scripts/Lines/DynamicComponent'], resolve));

        var promise = getSeletor(mod.Type).then(sel => {

            if (!sel)
                return chooseDynamicView(mod.Type);

            var viewName = sel(mod as Entity, new AuthInfo());

            if (viewName == "STATIC")
                throw new Error("STATIC not implemented");

            if (viewName == "NEW")
                return createDefaultDynamicView(mod.Type);

            if (viewName == "CHOOSE")
                return chooseDynamicView(mod.Type, true);

            return API.getDynamicView(mod.Type, viewName);
        });

        return new ViewPromise(resolve => require(['./View/DynamicViewComponent'], resolve))
            .withProps(promise.then(dv => ({ initialDynamicView: dv })));
    });
}



export function getSeletor(typeName: string): Promise<((e: Entity, auth: AuthInfo) => any) | undefined> {
    return API.getDynamicViewSelector(typeName).then(dvs => {
        if (!dvs)
            return undefined;

        return asFunction(dvs);
    });
}

export function asFunction(dvs: DynamicViewSelectorEntity): (e: Entity, auth: AuthInfo) => any {
    let code = dvs.script!;

    if (!code.contains(";") && !code.contains("return"))
        code = "return " + code + ";";

    code = "(function(e, auth){ " + code + "})";

    try {
        return eval(code);
    } catch (e) {
        throw new Error("Syntax in DynamicViewSelector for '" + dvs.entityType!.toStr + "':\r\n" + code + "\r\n" + (e as Error).message);
    }
}


export function chooseDynamicView(typeName: string, avoidMessage = false) {
    return API.getDynamicViewNames(typeName)
        .then(names => SelectorModal.chooseElement(names, {
            title: DynamicViewMessage.ChooseAView.niceToString(),
            message: avoidMessage ? undefined : DynamicViewMessage.SinceThereIsNoDynamicViewSelectorYouNeedToChooseAViewManually.niceToString(),
        })).then(viewName => getOrCreateDynamicView(typeName, viewName));
}

export function getOrCreateDynamicView(typeName: string, viewName: string | undefined): Promise<DynamicViewEntity> {
    return API.getDynamicView(typeName, viewName).then(dv => {
        if (dv)
            return dv;

        return createDefaultDynamicView(typeName);
    });
}

export function createDefaultDynamicView(typeName: string): Promise<DynamicViewEntity> {
    return Navigator.API.getType(typeName).then(t => DynamicViewEntity.New(dv => {
        dv.entityType = t;
        dv.viewName = "My View";
        const node = NodeConstructor.createDefaultNode(getTypeInfo(typeName));
        dv.viewContent = JSON.stringify(node);
    }));
}

export namespace API {

    export function getDynamicView(typeName: string, viewName: string | undefined): Promise<DynamicViewEntity | null> {

        var url = Navigator.currentHistory.createHref({
            pathname: `~/api/dynamic/view/${typeName}`,
            query: { viewName }
        });

        return ajaxGet<DynamicViewEntity | null>({ url });
    }

    export function getDynamicViewSelector(typeName: string): Promise<DynamicViewSelectorEntity> {
        return ajaxGet<DynamicViewSelectorEntity>({ url: `~/api/dynamic/selector/${typeName}`  });
    }

    export function getDynamicViewNames(typeName: string): Promise<string[]> {
        return ajaxGet<string[]>({ url: `~/api/dynamic/viewNames/${typeName}` });
    }

    export function getSuggestedFindOptions(typeName: string): Promise<SuggestedFindOptions[]> {
        return ajaxGet<SuggestedFindOptions[]>({ url: `~/api/dynamic/suggestedFindOptions/${typeName}` });
    }
}

export interface SuggestedFindOptions {
    queryKey: string;
    parentColumn: string;
}
