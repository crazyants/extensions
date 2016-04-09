﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using System.Web.Mvc.Html;
using Signum.Entities;
using Signum.Engine;
using Signum.Entities.Basics;
using Signum.Web;
using Signum.Engine.Maps;
using Signum.Utilities;
using Signum.Engine.SchemaInfoTables;
using Signum.Engine.Basics;
using Signum.Entities.Map;
using Signum.Engine.Authorization;
using Signum.React.Maps;

namespace Signum.Web.Map
{
    public class MapController : Controller
    {
        public ActionResult Index()
        {
            MapPermission.ViewMap.AssertAuthorized();
            
            SchemaMapInfo map = SchemaMap.GetMapInfo();

            ViewData["colorProviders"] = providers;

            return View(MapClient.ViewPrefix.FormatWith("SchemaMap"), map);
        }

        //public ActionResult Operation(string typeName)
        //{
        //    MapPermission.ViewMap.AssertAuthorized();

        //    OperationMapInfo map = OperationMap.GetOperationMapInfo(TypeLogic.GetType(typeName));

        //    return View(MapClient.ViewPrefix.FormatWith("OperationMap"), map);
        //}
    }
}
