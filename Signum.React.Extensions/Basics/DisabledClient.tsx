﻿import * as React from 'react'
import { Route } from 'react-router'
import { Dic, classes } from '../../../Framework/Signum.React/Scripts/Globals';
import { Button, OverlayTrigger, Tooltip, MenuItem } from "react-bootstrap"
import { ajaxPost, ajaxPostRaw, ajaxGet, saveFile } from '../../../Framework/Signum.React/Scripts/Services';
import { EntitySettings, ViewPromise } from '../../../Framework/Signum.React/Scripts/Navigator'
import * as Constructor from '../../../Framework/Signum.React/Scripts/Constructor'
import * as Navigator from '../../../Framework/Signum.React/Scripts/Navigator'
import * as Finder from '../../../Framework/Signum.React/Scripts/Finder'
import { Lite, Entity, EntityPack, ExecuteSymbol, DeleteSymbol, ConstructSymbol_From, registerToString, JavascriptMessage, toLite } from '../../../Framework/Signum.React/Scripts/Signum.Entities'
import { EntityOperationSettings } from '../../../Framework/Signum.React/Scripts/Operations'
import { PseudoType, QueryKey, GraphExplorer, OperationType, Type, getTypeName } from '../../../Framework/Signum.React/Scripts/Reflection'
import * as Operations from '../../../Framework/Signum.React/Scripts/Operations'
import { TimeSpanEmbedded, DateSpanEmbedded } from './Signum.Entities.Basics'
import * as OmniboxClient from '../Omnibox/OmniboxClient'
import * as AuthClient from '../Authorization/AuthClient'
import * as QuickLinks from '../../../Framework/Signum.React/Scripts/QuickLinks'
import { getAllTypes } from "../../../Framework/Signum.React/Scripts/Reflection";

export function start(options: { routes: JSX.Element[] }) {

    var typesToOverride = getAllTypes().filter(a => a.queryDefined && a.kind == "Entity" && a.members["[DisabledMixin].IsDisabled"]);

    typesToOverride.forEach(ti => {

        {
            var querySettings = Finder.getSettings(ti.name);

            if (!querySettings) {
                querySettings = { queryName: ti.name };
                Finder.addSettings(querySettings);
            }

            querySettings.hiddenColumns = [
                { columnName: "Entity.IsDisabled" }
            ];

            querySettings.rowAttributes = (row, columns) => {

                var index = columns.indexOf("Entity.IsDisabled");
                return row.columns[index] ? { style: { fontStyle: "italic", color: "gray" } } : undefined;
            };
        }

        {
            var entitySettings = Navigator.getSettings(ti.name);

            if (!entitySettings) {
                entitySettings = new EntitySettings(ti.name);
                Navigator.addSettings(entitySettings);
            }

            if (!entitySettings.findOptions) {
                entitySettings.findOptions = {
                    queryName: ti.name,
                    filterOptions: [{ columnName: "Entity.IsDisabled", operation: "EqualTo", value: false, frozen: true }]
                };
            }
        }
    });
}
