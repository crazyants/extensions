﻿import * as React from 'react'
import { Route } from 'react-router'
import { Dic, classes } from '../../../Framework/Signum.React/Scripts/Globals';
import { Button, OverlayTrigger, Tooltip, MenuItem } from "react-bootstrap"
import { ajaxPost, ajaxGet } from '../../../Framework/Signum.React/Scripts/Services';
import { EntitySettings} from '../../../Framework/Signum.React/Scripts/Navigator'
import * as Navigator from '../../../Framework/Signum.React/Scripts/Navigator'
import { Lite, Entity, EntityPack, ExecuteSymbol, DeleteSymbol, ConstructSymbol_From, registerToString, JavascriptMessage } from '../../../Framework/Signum.React/Scripts/Signum.Entities'
import { EntityOperationSettings } from '../../../Framework/Signum.React/Scripts/Operations'
import { PseudoType, QueryKey, GraphExplorer, OperationType, Type, getTypeName  } from '../../../Framework/Signum.React/Scripts/Reflection'
import * as Operations from '../../../Framework/Signum.React/Scripts/Operations'
import * as ContextualOperations from '../../../Framework/Signum.React/Scripts/Operations/ContextualOperations'
import { EmailMessageEntity, EmailTemplateMessageEntity, EmailMasterTemplateEntity, EmailPackageEntity, EmailRecipientEntity, EmailConfigurationEntity, EmailTemplateEntity, AsyncEmailSenderPermission } from './Signum.Entities.Mailing'
import { SmtpConfigurationEntity, Pop3ConfigurationEntity, Pop3ReceptionEntity, Pop3ReceptionExceptionEntity, EmailAddressEntity } from './Signum.Entities.Mailing'
import { NewsletterEntity, NewsletterDeliveryEntity, SendEmailTaskEntity } from './Signum.Entities.Mailing'
import * as OmniboxClient from '../Omnibox/OmniboxClient'
import * as AuthClient from '../Authorization/AuthClient'
import * as QuickLinks from '../../../Framework/Signum.React/Scripts/QuickLinks'

require("!style!css!./Mailing.css");

export function start(options: { routes: JSX.Element[], smtpConfig: boolean, newsletter: boolean, pop3Config: boolean, sendEmailTask: boolean, quickLinksFrom: PseudoType[] }) {
    options.routes.push(<Route path="asyncEmailSender">
        <Route path="view" getComponent={(loc, cb) => require(["./AsyncEmailSenderPage"], (Comp) => cb(null, Comp.default)) }/>
    </Route>);

    OmniboxClient.registerSpecialAction({
        allowed: () => AuthClient.isPermissionAuthorized(AsyncEmailSenderPermission.ViewAsyncEmailSenderPanel),
        key: "AsyncEmailSenderPanel",
        onClick: () => Promise.resolve(Navigator.currentHistory.createHref("/asyncEmailSender/view"))
    });

    registerToString<EmailTemplateMessageEntity>(EmailTemplateMessageEntity, a => a.cultureInfo == null ? JavascriptMessage.newEntity.niceToString() : a.cultureInfo.englishName);

    Navigator.addSettings(new EntitySettings(EmailMessageEntity, e => new Promise(resolve => require(['./Templates/EmailMessage'], resolve))));
    Navigator.addSettings(new EntitySettings(EmailTemplateEntity, e => new Promise(resolve => require(['./Templates/EmailTemplate'], resolve))));
    Navigator.addSettings(new EntitySettings(EmailMasterTemplateEntity, e => new Promise(resolve => require(['./Templates/EmailMasterTemplate'], resolve))));
    Navigator.addSettings(new EntitySettings(EmailPackageEntity, e => new Promise(resolve => require(['./Templates/EmailPackage'], resolve))));
    Navigator.addSettings(new EntitySettings(EmailRecipientEntity, e => new Promise(resolve => require(['./Templates/EmailRecipient'], resolve))));
    Navigator.addSettings(new EntitySettings(EmailAddressEntity, e => new Promise(resolve => require(['./Templates/EmailAddress'], resolve))));
    Navigator.addSettings(new EntitySettings(EmailConfigurationEntity, e => new Promise(resolve => require(['./Templates/EmailConfiguration'], resolve))));

    if (options.smtpConfig) {
        Navigator.addSettings(new EntitySettings(SmtpConfigurationEntity, e => new Promise(resolve => require(['./Templates/SmtpConfiguration'], resolve))));
    }

    if (options.newsletter) {
        Navigator.addSettings(new EntitySettings(NewsletterEntity, e => new Promise(resolve => require(['./Newsletters/Newsletter'], resolve))));
        Navigator.addSettings(new EntitySettings(NewsletterDeliveryEntity, e => new Promise(resolve => require(['./Newsletters/NewsletterDelivery'], resolve))));
    }

    if (options.sendEmailTask) {
        Navigator.addSettings(new EntitySettings(SendEmailTaskEntity, e => new Promise(resolve => require(['./Templates/SendEmailTask'], resolve))));
    }

    if (options.pop3Config) {
        Navigator.addSettings(new EntitySettings(Pop3ConfigurationEntity, e => new Promise(resolve => require(['./Pop3/Pop3Configuration'], resolve))));
        Navigator.addSettings(new EntitySettings(Pop3ReceptionEntity, e => new Promise(resolve => require(['./Pop3/Pop3Reception'], resolve))));
    }

    if (options.quickLinksFrom) {
        QuickLinks.registerGlobalQuickLink(ctx => {
            if (options.quickLinksFrom.some(e => getTypeName(e) == ctx.lite.EntityType))
                return new QuickLinks.QuickLinkExplore({ queryName: EmailMessageEntity, parentColumn: "Target", parentValue: ctx.lite });

            return null;
        });
    }

}


export module API {
    export function start(): Promise<void> {
        return ajaxPost<void>({ url: "/api/asyncEmailSender/start" }, null);
    }

    export function stop(): Promise<void> {
        return ajaxPost<void>({ url: "/api/asyncEmailSender/stop" }, null);
    }

    export function view(): Promise<AsyncEmailSenderState> {
        return ajaxGet<AsyncEmailSenderState>({ url: "/api/asyncEmailSender/view" });
    }
}


export interface AsyncEmailSenderState {
    AsyncSenderPeriod: number;
    Running: boolean;
    IsCancelationRequested: boolean;
    NextPlannedExecution: string;
    QueuedItems: number;
    MachineName: string;
    ApplicationName: string;
    CurrentProcessIdentifier: string;
}