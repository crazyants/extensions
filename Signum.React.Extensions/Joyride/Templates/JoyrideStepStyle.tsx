﻿import * as React from 'react'
import { Tabs, Tab } from 'react-bootstrap'
import { JoyrideStepStyleEntity } from '../Signum.Entities.Joyride'
import { ValueLine, EntityLine, EntityCombo, EntityList, EntityDetail, EntityStrip, EntityRepeater, TypeContext, RenderEntity } from '../../../../Framework/Signum.React/Scripts/Lines'
import { ColorTypeaheadLine } from '../../Basics/Templates/ColorTypeahead';

export default class JoyrideStepStyle extends React.Component<{ ctx: TypeContext<JoyrideStepStyleEntity> }> {

    render() {
        const ctx = this.props.ctx;
        return (
            <div>
                <ValueLine ctx={ctx.subCtx(a => a.name)} />
                <ColorTypeaheadLine ctx={ctx.subCtx(a => a.color)} />
                <ColorTypeaheadLine ctx={ctx.subCtx(a => a.mainColor)} />
                <ColorTypeaheadLine ctx={ctx.subCtx(a => a.backgroundColor)} />
                <ValueLine ctx={ctx.subCtx(a => a.borderRadius)} />
                <ValueLine ctx={ctx.subCtx(a => a.textAlign)} />
                <ValueLine ctx={ctx.subCtx(a => a.width)} />
            </div>
        );
    }
}
