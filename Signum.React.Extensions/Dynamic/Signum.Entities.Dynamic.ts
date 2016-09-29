//////////////////////////////////
//Auto-generated. Do NOT modify!//
//////////////////////////////////

import { MessageKey, QueryKey, Type, EnumType, registerSymbol } from '../../../Framework/Signum.React/Scripts/Reflection'
import * as Entities from '../../../Framework/Signum.React/Scripts/Signum.Entities'
import * as Basics from '../../../Framework/Signum.React/Scripts/Signum.Entities.Basics'

interface IEvaluator {}
export const DynamicValidationEntity = new Type<DynamicValidationEntity>("DynamicValidation");
export interface DynamicValidationEntity extends Entities.Entity {
    Type: "DynamicValidation";
    name?: string | null;
    entityType?: Basics.TypeEntity | null;
    propertyRoute?: Basics.PropertyRouteEntity | null;
    isGlobalyEnabled?: boolean;
    eval: DynamicValidationEval;
}

export const DynamicValidationEval = new Type<DynamicValidationEval>("DynamicValidationEval");
export interface DynamicValidationEval extends EvalEntity<IEvaluator> {
    Type: "DynamicValidationEval";
}

export module DynamicValidationOperation {
    export const Save : Entities.ExecuteSymbol<DynamicValidationEntity> = registerSymbol("Operation", "DynamicValidationOperation.Save");
}

export const DynamicViewEntity = new Type<DynamicViewEntity>("DynamicView");
export interface DynamicViewEntity extends Entities.Entity {
    Type: "DynamicView";
    viewName?: string | null;
    entityType?: Basics.TypeEntity | null;
    viewContent?: string | null;
}

export module DynamicViewMessage {
    export const AddChild = new MessageKey("DynamicViewMessage", "AddChild");
    export const AddSibling = new MessageKey("DynamicViewMessage", "AddSibling");
    export const Remove = new MessageKey("DynamicViewMessage", "Remove");
    export const SelectATypeOfComponent = new MessageKey("DynamicViewMessage", "SelectATypeOfComponent");
    export const SelectANodeFirst = new MessageKey("DynamicViewMessage", "SelectANodeFirst");
    export const UseExpression = new MessageKey("DynamicViewMessage", "UseExpression");
    export const SuggestedFindOptions = new MessageKey("DynamicViewMessage", "SuggestedFindOptions");
    export const TheFollowingQueriesReference0 = new MessageKey("DynamicViewMessage", "TheFollowingQueriesReference0");
    export const ChooseAView = new MessageKey("DynamicViewMessage", "ChooseAView");
    export const SinceThereIsNoDynamicViewSelectorYouNeedToChooseAViewManually = new MessageKey("DynamicViewMessage", "SinceThereIsNoDynamicViewSelectorYouNeedToChooseAViewManually");
}

export module DynamicViewOperation {
    export const Create : Entities.ConstructSymbol_Simple<DynamicViewEntity> = registerSymbol("Operation", "DynamicViewOperation.Create");
    export const Clone : Entities.ConstructSymbol_From<DynamicViewEntity, DynamicViewEntity> = registerSymbol("Operation", "DynamicViewOperation.Clone");
    export const Save : Entities.ExecuteSymbol<DynamicViewEntity> = registerSymbol("Operation", "DynamicViewOperation.Save");
    export const Delete : Entities.DeleteSymbol<DynamicViewEntity> = registerSymbol("Operation", "DynamicViewOperation.Delete");
}

export const DynamicViewSelectorEntity = new Type<DynamicViewSelectorEntity>("DynamicViewSelector");
export interface DynamicViewSelectorEntity extends Entities.Entity {
    Type: "DynamicViewSelector";
    entityType?: Basics.TypeEntity | null;
    script?: string | null;
}

export module DynamicViewSelectorOperation {
    export const Save : Entities.ExecuteSymbol<DynamicViewSelectorEntity> = registerSymbol("Operation", "DynamicViewSelectorOperation.Save");
    export const Delete : Entities.DeleteSymbol<DynamicViewSelectorEntity> = registerSymbol("Operation", "DynamicViewSelectorOperation.Delete");
}

export module DynamicViewValidationMessage {
    export const OnlyChildNodesOfType0Allowed = new MessageKey("DynamicViewValidationMessage", "OnlyChildNodesOfType0Allowed");
    export const Type0DoesNotContainsField1 = new MessageKey("DynamicViewValidationMessage", "Type0DoesNotContainsField1");
    export const Member0IsMandatoryFor1 = new MessageKey("DynamicViewValidationMessage", "Member0IsMandatoryFor1");
    export const _0RequiresA1 = new MessageKey("DynamicViewValidationMessage", "_0RequiresA1");
    export const Entity = new MessageKey("DynamicViewValidationMessage", "Entity");
    export const CollectionOfEntities = new MessageKey("DynamicViewValidationMessage", "CollectionOfEntities");
    export const Value = new MessageKey("DynamicViewValidationMessage", "Value");
    export const CollectionOfEnums = new MessageKey("DynamicViewValidationMessage", "CollectionOfEnums");
    export const EntityOrValue = new MessageKey("DynamicViewValidationMessage", "EntityOrValue");
}

export interface EvalEntity<T> extends Entities.EmbeddedEntity {
    script?: string | null;
}

