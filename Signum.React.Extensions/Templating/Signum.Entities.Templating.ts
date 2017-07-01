//////////////////////////////////
//Auto-generated. Do NOT modify!//
//////////////////////////////////

import { MessageKey, QueryKey, Type, EnumType, registerSymbol } from '../../../Framework/Signum.React/Scripts/Reflection'
import * as Entities from '../../../Framework/Signum.React/Scripts/Signum.Entities'

import { FilterOptionParsed, OrderOptionParsed, FilterRequest, OrderRequest, Pagination } from '../../../Framework/Signum.React/Scripts/FindOptions' 

//Partial
export interface QueryModel {
    queryKey: string;

    filters: FilterRequest[];
    orders: OrderRequest[];
    pagination: Pagination;
}
export const ModelConverterSymbol = new Type<ModelConverterSymbol>("ModelConverter");
export interface ModelConverterSymbol extends Entities.Symbol {
    Type: "ModelConverter";
}

export const MultiEntityModel = new Type<MultiEntityModel>("MultiEntityModel");
export interface MultiEntityModel extends Entities.ModelEntity {
    Type: "MultiEntityModel";
    entities: Entities.MList<Entities.Lite<Entities.Entity>>;
}

export const QueryModel = new Type<QueryModel>("QueryModel");
export interface QueryModel extends Entities.ModelEntity {
    Type: "QueryModel";
}

export module QueryModelMessage {
    export const ConfigureYourQueryAndPressSearchBeforeOk = new MessageKey("QueryModelMessage", "ConfigureYourQueryAndPressSearchBeforeOk");
}

export module TemplateTokenMessage {
    export const Insert = new MessageKey("TemplateTokenMessage", "Insert");
    export const NoColumnSelected = new MessageKey("TemplateTokenMessage", "NoColumnSelected");
    export const YouCannotAddIfBlocksOnCollectionFields = new MessageKey("TemplateTokenMessage", "YouCannotAddIfBlocksOnCollectionFields");
    export const YouHaveToAddTheElementTokenToUseForeachOnCollectionFields = new MessageKey("TemplateTokenMessage", "YouHaveToAddTheElementTokenToUseForeachOnCollectionFields");
    export const YouCanOnlyAddForeachBlocksWithCollectionFields = new MessageKey("TemplateTokenMessage", "YouCanOnlyAddForeachBlocksWithCollectionFields");
    export const YouCannotAddBlocksWithAllOrAny = new MessageKey("TemplateTokenMessage", "YouCannotAddBlocksWithAllOrAny");
}


