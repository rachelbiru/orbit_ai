import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, ClipboardList, School } from "lucide-react";
import ManagerJudges from "@/pages/manager-judges";
import ManagerAssignments from "@/pages/manager-assignments";
import ManagerTeamTracking from "@/pages/manager-team-tracking";

type Tab = "judges" | "assignments" | "teams";

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "judges", label: "Judges", icon: Users },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "teams", label: "Teams", icon: School },
];

export default function ManagerManage() {
  const [activeTab, setActiveTab] = useState<Tab>("judges");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 border-b border-border pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "judges" && <ManagerJudges />}
        {activeTab === "assignments" && <ManagerAssignments />}
        {activeTab === "teams" && <ManagerTeamTracking />}
      </div>
    </div>
  );
}
