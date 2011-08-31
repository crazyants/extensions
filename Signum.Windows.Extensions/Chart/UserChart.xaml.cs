﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Signum.Entities.DynamicQuery;
using Signum.Entities.Chart;
using Signum.Entities.Reports;
using Signum.Entities;
using Signum.Entities.UserQueries;

namespace Signum.Windows.Chart
{
    /// <summary>
    /// Interaction logic for ChartRequest.xaml
    /// </summary>
    public partial class UserChart : UserControl
    {
        public UserChart()
        {
            InitializeComponent();
        }

        public static readonly DependencyProperty QueryDescriptionProperty =
            DependencyProperty.Register("QueryDescription", typeof(QueryDescription), typeof(UserChart), new UIPropertyMetadata(null));
        public QueryDescription QueryDescription
        {
            get { return (QueryDescription)GetValue(QueryDescriptionProperty); }
            set { SetValue(QueryDescriptionProperty, value); }
        }

        private QueryToken[] QueryTokenBuilderFilter_SubTokensEvent(QueryToken token)
        {
            return QueryUtils.SubTokens(token, QueryDescription.Columns);
        }

        internal static UserChartDN FromRequest(ChartRequest request)
        {
            var result = new UserChartDN
            {
                Query = QueryClient.GetQuery(request.QueryName),

                Chart=
                {
                    GroupResults = request.Chart.GroupResults,
                    ChartType = request.Chart.ChartType,
                },

                Filters = request.Filters.Select(f => new QueryFilterDN
                {
                    Token = f.Token,
                    Operation = f.Operation,
                    ValueString = FilterValueConverter.ToString(f.Value, f.Token.Type),
                }).ToMList(),
            };

            Assign(result.Chart.FirstDimension, request.Chart.FirstDimension);
            Assign(result.Chart.SecondDimension, request.Chart.SecondDimension);
            Assign(result.Chart.FirstValue, request.Chart.FirstValue);
            Assign(result.Chart.SecondValue, request.Chart.SecondValue);

            return result;
        }

        private static void Assign(ChartTokenDN result, ChartTokenDN request)
        {
            if (request == null || result == null)
                return;

            if (request.Token != null)
                result.Token = request.Token.Clone();

            result.Aggregate = request.Aggregate;

            result.Unit = request.Unit;
            result.Format = request.Format;
            result.DisplayName = request.DisplayName;

            result.OrderPriority = request.OrderPriority;
            result.OrderType = request.OrderType; 
        }

        internal static ChartRequest ToRequest(UserChartDN uq)
        {
            var result = new ChartRequest(QueryClient.GetQueryName(uq.Query.Key))
            {
                Chart = 
                {
                    GroupResults = uq.Chart.GroupResults,
                    ChartType = uq.Chart.ChartType,
                },

                Filters = uq.Filters.Select(qf => new Filter
                {
                    Token = qf.Token,
                    Operation = qf.Operation,
                    Value = qf.Value
                }).ToList(),
            };

            Assign(result.Chart.FirstDimension, uq.Chart.FirstDimension);
            Assign(result.Chart.SecondDimension, uq.Chart.SecondDimension);
            Assign(result.Chart.FirstValue, uq.Chart.FirstValue);
            Assign(result.Chart.SecondValue, uq.Chart.SecondValue);

            return result;

        }
    }
}
