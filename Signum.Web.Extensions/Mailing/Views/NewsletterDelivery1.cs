﻿//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.237
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace ASP
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Web;
    using System.Web.Helpers;
    using System.Web.Security;
    using System.Web.UI;
    using System.Web.WebPages;
    using System.Web.Mvc;
    using System.Web.Mvc.Ajax;
    using System.Web.Mvc.Html;
    using System.Web.Routing;
    using Signum.Utilities;
    using Signum.Entities;
    using Signum.Web;
    using System.Collections;
    using System.Collections.Specialized;
    using System.ComponentModel.DataAnnotations;
    using System.Configuration;
    using System.Text;
    using System.Text.RegularExpressions;
    using System.Web.Caching;
    using System.Web.DynamicData;
    using System.Web.SessionState;
    using System.Web.Profile;
    using System.Web.UI.WebControls;
    using System.Web.UI.WebControls.WebParts;
    using System.Web.UI.HtmlControls;
    using System.Xml.Linq;
    using Signum.Entities.Mailing;
    
    [System.CodeDom.Compiler.GeneratedCodeAttribute("MvcRazorClassGenerator", "1.0")]
    [System.Web.WebPages.PageVirtualPathAttribute("~/Mailing/Views/NewsletterDelivery.cshtml")]
    public class _Page_Mailing_Views_NewsletterDelivery_cshtml : System.Web.Mvc.WebViewPage<dynamic>
    {


        public _Page_Mailing_Views_NewsletterDelivery_cshtml()
        {
        }
        protected System.Web.HttpApplication ApplicationInstance
        {
            get
            {
                return ((System.Web.HttpApplication)(Context.ApplicationInstance));
            }
        }
        public override void Execute()
        {

WriteLiteral("\r\n");


 using (var nc = Html.TypeContext<NewsletterDeliveryDN>()) 
{
	
Write(Html.ValueLine(nc, n => n.Sent, v => v.ReadOnly = true));

                                                         
	
Write(Html.ValueLine(nc, n => n.SendDate, v => v.ReadOnly = true));

                                                             
	
Write(Html.EntityLine(nc, n => n.Recipient, v => v.ReadOnly = true));

                                                               
	
Write(Html.EntityLine(nc, n => n.Newsletter, v => v.ReadOnly = true));

                                                                
	
Write(Html.ValueLine(nc, n => n.Error, v => v.ReadOnly = true));

                                                          
}


        }
    }
}