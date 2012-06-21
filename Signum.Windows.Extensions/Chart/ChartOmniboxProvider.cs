﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Signum.Windows.Omnibox;
using Signum.Entities.UserQueries;
using Signum.Entities.Omnibox;
using System.Windows.Documents;
using System.Windows.Media;
using Signum.Utilities;
using Signum.Windows.Authorization;
using Signum.Entities.Chart;
using Signum.Entities.DynamicQuery;
using Signum.Windows.Extensions.Properties;

namespace Signum.Windows.Chart
{
    public class ChartOmniboxProvider : OmniboxProvider<ChartOmniboxResult>
    {
        public override OmniboxResultGenerator<ChartOmniboxResult> CreateGenerator()
        {
            return new ChartOmniboxResultGenerator(QueryClient.queryNames.Values);
        }

        public override void RenderLines(ChartOmniboxResult result, InlineCollection lines)
        {
            lines.AddMatch(result.KeywordMatch);

            if (result.QueryNameMatch != null)
            {
                lines.Add(" ");
                lines.AddMatch(result.QueryNameMatch);
            }

            lines.Add(new Run(" ({0})".Formato(Signum.Windows.Extensions.Properties.Resources.Chart)) { Foreground = Brushes.Violet });
        }

        public override void OnSelected(ChartOmniboxResult result)
        {
            ChartWindow window = new ChartWindow()
            {
                DataContext = new ChartRequest(result.QueryName)
            };

            window.Show();
        }
    }
}