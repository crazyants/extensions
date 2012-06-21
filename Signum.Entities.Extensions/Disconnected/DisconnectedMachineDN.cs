﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Signum.Entities.Authorization;
using System.Linq.Expressions;
using Signum.Utilities;

namespace Signum.Entities.Disconnected
{
    [Serializable]
    public class DisconnectedMachineDN : Entity
    {
        DateTime creationDate = TimeZoneManager.Now;
        public DateTime CreationDate
        {
            get { return creationDate; }
            private set { Set(ref creationDate, value, () => CreationDate); }
        }

        [NotNullable, SqlDbType(Size = 100), UniqueIndex]
        string machineName;
        [StringLengthValidator(AllowNulls = false, Min = 1, Max = 100)]
        public string MachineName
        {
            get { return machineName; }
            set { Set(ref machineName, value, () => MachineName); }
        }

        bool isOffline;
        public bool IsOffline
        {
            get { return isOffline; }
            set { Set(ref isOffline, value, () => IsOffline); }
        }

        int seedMin;
        public int SeedMin
        {
            get { return seedMin; }
            set { Set(ref seedMin, value, () => SeedMin); }
        }

        int seedMax;
        public int SeedMax
        {
            get { return seedMax; }
            set { Set(ref seedMax, value, () => SeedMax); }
        }

        static Expression<Func<DisconnectedMachineDN, string>> ToStringExpression = e => e.machineName;
        public override string ToString()
        {
            return ToStringExpression.Evaluate(this);
        }

        public static readonly SessionVariable<Lite<DisconnectedMachineDN>> CurrentVariable = 
            Statics.SessionVariable<Lite<DisconnectedMachineDN>>("disconectedMachine");
        public static Lite<DisconnectedMachineDN> Current
        {
            get { return CurrentVariable.Value; }
            set { CurrentVariable.Value = value; }
        }
    }

    public enum DisconnectedMachineOperations
    {
        Save,
        UnsafeUnlock 
    }

    public interface IDisconnectedEntity : IIdentifiable
    {
        long Ticks { get; set; }
        long? LastOnlineTicks { get; set; }
        Lite<DisconnectedMachineDN> DisconnectedMachine { get; set; }
    }

    [Serializable]
    public class StrategyPair
    {
        public Download Download;
        public Upload Upload;
    }

    
    public enum Download
    {
        None,
        All,
        Subset
    }

    public enum Upload
    {
        None,
        New,
        Subset
    }
}