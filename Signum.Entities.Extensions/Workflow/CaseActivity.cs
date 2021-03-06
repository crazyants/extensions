﻿using Signum.Entities;
using Signum.Entities.Authorization;
using Signum.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Signum.Entities.Dynamic;
using Signum.Entities.Scheduler;
using Signum.Entities.Processes;
using System.Reflection;
using Signum.Entities.Reflection;
using Signum.Entities.Basics;

namespace Signum.Entities.Workflow
{
    [Serializable, EntityKind(EntityKind.System, EntityData.Transactional), InTypeScript(Undefined = false)]
    public class CaseActivityEntity : Entity
    {
        [NotNullable]
        [NotNullValidator]
        public CaseEntity Case { get; set; }
        
        [NotNullable]
        [NotNullValidator]
        public WorkflowActivityEntity WorkflowActivity { get; set; }

        [NotNullable, SqlDbType(Size = 255)]
        [StringLengthValidator(AllowNulls = false, Min = 3, Max = 255)]
        public string OriginalWorkflowActivityName { get; set; }

        public DateTime StartDate { get; set; } = TimeZoneManager.Now;
        public Lite<CaseActivityEntity> Previous { get; set; }

        [SqlDbType(Size = int.MaxValue)]
        [StringLengthValidator(AllowNulls = true, MultiLine = true)]
        public string Note { get; set; }
        
        public DateTime? DoneDate { get; set; }

        [Unit("min")]
        public double? Duration { get; set; }

        public Lite<UserEntity> DoneBy { get; set; }
        public DoneType? DoneType { get; set; }


        public ScriptExecutionEmbedded ScriptExecution { get; set; }

        static Expression<Func<CaseActivityEntity, CaseActivityState>> StateExpression =
        @this => @this.DoneDate.HasValue ? CaseActivityState.Done :
        @this.WorkflowActivity.Type == WorkflowActivityType.Decision ? CaseActivityState.PendingDecision : 
        CaseActivityState.PendingNext;
        [ExpressionField("StateExpression")]
        public CaseActivityState State
        {
            get
            {
                if (this.IsNew)
                    return CaseActivityState.New;

                return StateExpression.Evaluate(this);
            }
        }

        static Expression<Func<CaseActivityEntity, string>> ToStringExpression = @this => @this.WorkflowActivity + " " + @this.DoneBy;
        [ExpressionField]
        public override string ToString()
        {
            return ToStringExpression.Evaluate(this);
        }

        protected override void PreSaving(ref bool graphModified)
        {
            base.PreSaving(ref graphModified);
            this.Duration = this.DoneDate == null ? (double?)null :
                (this.DoneDate.Value - this.StartDate).TotalMinutes;
        }
    }

    [Serializable]
    public class ScriptExecutionEmbedded : EmbeddedEntity
    {
        public DateTime NextExecution { get; set; }
        public int RetryCount { get; set; }
        public Guid? ProcessIdentifier { get; set; }
    }
    
    public enum DoneType
    {
        Next,
        Approve,
        Decline,
        Jump,
        Rejected,
        Timeout,
        ScriptSuccess,
        ScriptFailure,
    }

    public enum CaseActivityState
    {
        [Ignore]
        New,
        PendingNext,
        PendingDecision,
        Done,
    }


    [AutoInit]
    public static class CaseActivityOperation
    {
        public static readonly ConstructSymbol<CaseActivityEntity>.From<WorkflowEntity> CreateCaseActivityFromWorkflow;
        public static readonly ConstructSymbol<CaseEntity>.From<WorkflowEventTaskEntity> CreateCaseFromWorkflowEventTask;
        public static readonly ExecuteSymbol<CaseActivityEntity> Register;
        public static readonly DeleteSymbol<CaseActivityEntity> Delete;
        public static readonly ExecuteSymbol<CaseActivityEntity> Next;
        public static readonly ExecuteSymbol<CaseActivityEntity> Approve;
        public static readonly ExecuteSymbol<CaseActivityEntity> Decline;
        public static readonly ExecuteSymbol<CaseActivityEntity> Jump;
        public static readonly ExecuteSymbol<CaseActivityEntity> Reject;
        public static readonly ExecuteSymbol<CaseActivityEntity> Timeout;
        public static readonly ExecuteSymbol<CaseActivityEntity> MarkAsUnread;
        public static readonly ExecuteSymbol<CaseActivityEntity> Undo;
        public static readonly ExecuteSymbol<CaseActivityEntity> ScriptExecute;
        public static readonly ExecuteSymbol<CaseActivityEntity> ScriptScheduleRetry;
        public static readonly ExecuteSymbol<CaseActivityEntity> ScriptFailureJump;

        public static readonly ExecuteSymbol<DynamicTypeEntity> FixCaseDescriptions;
    }

    [AutoInit]
    public static class CaseActivityTask
    {
        public static readonly SimpleTaskSymbol Timeout;
    }

    [AutoInit]
    public static class CaseActivityProcessAlgorithm
    {
        public static readonly ProcessAlgorithmSymbol Timeout;
    }

    public enum CaseActivityMessage
    {
        CaseContainsOtherActivities,
        NoNextConnectionThatSatisfiesTheConditionsFound,
        [Description("Case is a decomposition of {0}")]
        CaseIsADecompositionOf0,
        [Description("From {0} on {1}")]
        From0On1,
        [Description("Done by {0} on {1}")]
        DoneBy0On1,
        PersonalRemarksForThisNotification,
        [Description("The activity '{0}' requires to be opened")]
        TheActivity0RequiresToBeOpened,
        NoOpenedOrInProgressNotificationsFound,
        NextActivityAlreadyInProgress,
        NextActivityOfDecompositionSurrogateAlreadyInProgress,
        [Description("Only '{0}' can undo this operation")]
        Only0CanUndoThisOperation,
        [Description("Activity '{0}' has no jumps")]
        Activity0HasNoJumps,
        [Description("Activity '{0}' has no reject")]
        Activity0HasNoReject,
        [Description("Activity '{0}' has no timeout")]
        Activity0HasNoTimeout,
        ThereIsNoPreviousActivity,
        OnlyForScriptWorkflowActivities,
        Pending
    }


    public enum CaseActivityQuery
    {
        Inbox
    }

    [Serializable]
    public class ActivityWithRemarks : ModelEntity
    {
        public Lite<WorkflowActivityEntity> workflowActivity { get; set; }
        public Lite<CaseEntity> @case { get; set; }
        public Lite<CaseActivityEntity> caseActivity { get; set; }
        public Lite<CaseNotificationEntity> notification { get; set; }
        public string remarks { get; set; }
        public int alerts { get; set; }
        public List<CaseTagTypeEntity> tags { get; set; }
    }
}
