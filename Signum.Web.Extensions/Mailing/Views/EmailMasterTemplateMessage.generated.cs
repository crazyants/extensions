﻿#pragma warning disable 1591
//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.18051
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Signum.Web.Extensions.Mailing.Views
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Text;
    using System.Web;
    using System.Web.Helpers;
    using System.Web.Mvc;
    using System.Web.Mvc.Ajax;
    using System.Web.Mvc.Html;
    using System.Web.Routing;
    using System.Web.Security;
    using System.Web.UI;
    using System.Web.WebPages;
    
    #line 5 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Engine;
    
    #line default
    #line hidden
    
    #line 3 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Engine.Translation;
    
    #line default
    #line hidden
    
    #line 4 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Entities;
    
    #line default
    #line hidden
    
    #line 7 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Entities.DynamicQuery;
    
    #line default
    #line hidden
    
    #line 1 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Entities.Mailing;
    
    #line default
    #line hidden
    
    #line 2 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Entities.Translation;
    
    #line default
    #line hidden
    using Signum.Utilities;
    
    #line 6 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Web;
    
    #line default
    #line hidden
    
    #line 8 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
    using Signum.Web.Mailing;
    
    #line default
    #line hidden
    
    [System.CodeDom.Compiler.GeneratedCodeAttribute("RazorGenerator", "2.0.0.0")]
    [System.Web.WebPages.PageVirtualPathAttribute("~/Mailing/Views/EmailMasterTemplateMessage.cshtml")]
    public partial class EmailMasterTemplateMessage : System.Web.Mvc.WebViewPage<dynamic>
    {
        public EmailMasterTemplateMessage()
        {
        }
        public override void Execute()
        {









            
            #line 9 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
 using (var ec = Html.TypeContext<EmailMasterTemplateMessageDN>())
{

            
            #line default
            #line hidden
WriteLiteral("    <div class=\"sf-email-template-message\">\r\n        <input type=\"hidden\" class=\"" +
"sf-email-culture\" value=\"");


            
            #line 12 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
                                                         Write(ec.Value.CultureInfo.TryToString());

            
            #line default
            #line hidden
WriteLiteral("\" />\r\n        \r\n        ");


            
            #line 14 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
   Write(Html.EntityCombo(ec, e => e.CultureInfo, vl =>
        {
            vl.LabelText = EmailTemplateViewMessage.Language.NiceToString();
        }));

            
            #line default
            #line hidden
WriteLiteral("\r\n        \r\n        <div class=\"sf-template-message-insert-container\">\r\n         " +
"   <input type=\"button\" class=\"sf-button sf-master-template-insert-content\" valu" +
"e=\"");


            
            #line 20 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
                                                                                        Write(EmailTemplateViewMessage.InsertMessageContent.NiceToString());

            
            #line default
            #line hidden
WriteLiteral("\" />\r\n        </div>\r\n\r\n        ");


            
            #line 23 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
   Write(Html.ValueLine(ec, e => e.Text, vl =>
        {
            vl.LabelVisible = false;
            vl.ValueLineType = ValueLineType.TextArea;
            vl.ValueHtmlProps["style"] = "width:100%; height:180px;";
            vl.ValueHtmlProps["class"] = "sf-rich-text-editor sf-email-template-message-text";
        }));

            
            #line default
            #line hidden
WriteLiteral("\r\n        \r\n        <script>\r\n            $(function () {\r\n                SF.Mai" +
"ling.initHtmlEditorMasterTemplate(\"");


            
            #line 33 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
                                                    Write(ec.SubContext(e => e.Text).ControlID);

            
            #line default
            #line hidden
WriteLiteral("\");\r\n            });\r\n        </script>\r\n    </div>\r\n");


            
            #line 37 "..\..\Mailing\Views\EmailMasterTemplateMessage.cshtml"
}
            
            #line default
            #line hidden

        }
    }
}
#pragma warning restore 1591
