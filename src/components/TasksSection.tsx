"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabase/utils/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  Users,
  RefreshCw,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { AddTaskDialog, Task } from "@/components/AddTaskDialog";
import Link from "next/link";

interface Couple {
  id: number;
  bride_name: string;
  groom_name: string;
}

interface TaskRecord {
  id: number;
  couple_id: number;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  priority?: string;
  category?: string;
  created_at: string;
}

export function TasksSection() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Couple selection state - CRITICAL FOR DATA ISOLATION
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<number | null>(null);
  const [selectedCouple, setSelectedCouple] = useState<Couple | null>(null);

  // Tasks for SELECTED couple only
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);

  // Filter state
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  // Fetch couples when user is available
  useEffect(() => {
    if (user) {
      fetchCouples();
    }
  }, [user]);

  // Fetch tasks when selected couple changes - CRITICAL!
  useEffect(() => {
    if (selectedCoupleId && user) {
      // Clear old tasks immediately to prevent data leak
      setTasks([]);

      // Fetch new tasks for selected couple
      fetchTasksForCouple(selectedCoupleId);

      // Update selected couple object
      const couple = couples.find(c => c.id === selectedCoupleId);
      setSelectedCouple(couple || null);
    } else {
      // No couple selected - clear all task data
      setTasks([]);
      setSelectedCouple(null);
    }
  }, [selectedCoupleId, couples]);

  // Real-time subscription for tasks
  useEffect(() => {
    if (!user?.id || !selectedCoupleId) return;

    const channel = supabase
      .channel(`tasks-couple-${selectedCoupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `couple_id=eq.${selectedCoupleId}`,
        },
        () => {
          console.log("📋 Real-time task update for couple", selectedCoupleId);
          fetchTasksForCouple(selectedCoupleId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedCoupleId]);

  const fetchCouples = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("couples")
        .select("id, bride_name, groom_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCouples(data);
        // Auto-select first couple if available
        if (data.length > 0 && !selectedCoupleId) {
          setSelectedCoupleId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching couples:", err);
    }
  };

  // Fetch tasks for a SPECIFIC couple only - NO DATA MIXING!
  const fetchTasksForCouple = async (coupleId: number) => {
    if (!user || !coupleId) return;

    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("couple_id", coupleId)  // ⚠️ CRITICAL: Filter by couple_id
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
        return;
      }

      setTasks(data || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !completed, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task:", error);
        return;
      }

      // Update local state
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, completed: !completed } : task
      ));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task.");
        return;
      }

      // Remove from local state
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleAddTask = () => {
    // Refresh tasks after adding
    if (selectedCoupleId) {
      fetchTasksForCouple(selectedCoupleId);
    }
    setShowAddTaskDialog(false);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-blue-100 text-blue-800 border-blue-200";
      case "low": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter(task => !task.completed);

  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.filter(task => !task.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                <p className="text-green-600 font-medium">Manage your ceremony tasks</p>
              </div>
            </div>
            {selectedCoupleId && (
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-100 text-green-800">
                  {pendingCount} pending
                </Badge>
                <Badge className="bg-gray-100 text-gray-800">
                  {completedCount} completed
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Couple Selector - CRITICAL FOR DATA ISOLATION */}
        <Card className="border-blue-200 shadow-md mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-blue-900">Select Couple</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchCouples();
                  if (selectedCoupleId) fetchTasksForCouple(selectedCoupleId);
                }}
                className="text-blue-600 border-blue-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              View and manage tasks for a specific couple
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCoupleId?.toString() || ""}
              onValueChange={(value) => setSelectedCoupleId(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-96 border-blue-200">
                <SelectValue placeholder="Choose a couple to view their tasks..." />
              </SelectTrigger>
              <SelectContent>
                {couples.length === 0 ? (
                  <SelectItem value="no-couples">
                    No couples found
                  </SelectItem>
                ) : (
                  couples.map((couple) => (
                    <SelectItem key={couple.id} value={couple.id.toString()}>
                      {couple.bride_name} & {couple.groom_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedCouple && (
              <div className="mt-3 text-sm text-blue-700">
                <span className="font-medium">Viewing tasks for:</span>{" "}
                {selectedCouple.bride_name} & {selectedCouple.groom_name}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-900">
                  Tasks
                  {selectedCouple && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      ({selectedCouple.bride_name} & {selectedCouple.groom_name})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedCouple
                    ? `Tasks for ${selectedCouple.bride_name} & ${selectedCouple.groom_name}'s ceremony`
                    : "Select a couple above to view their tasks"
                  }
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <Checkbox
                    checked={showCompleted}
                    onCheckedChange={(checked: boolean) => setShowCompleted(checked)}
                  />
                  <span>Show completed</span>
                </label>
                <Button
                  onClick={() => setShowAddTaskDialog(true)}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={!selectedCoupleId}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!selectedCoupleId ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select a couple to view their tasks</p>
                <p className="text-sm mt-2">Choose a couple from the dropdown above</p>
              </div>
            ) : loadingTasks ? (
              <div className="text-center py-12 text-gray-500">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">
                  {showCompleted ? "No tasks yet" : "All tasks completed!"}
                </p>
                <p className="text-sm mt-2">
                  {showCompleted
                    ? `Add tasks for ${selectedCouple?.bride_name} & ${selectedCouple?.groom_name}`
                    : "Great job! Check 'Show completed' to see finished tasks"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${
                      task.completed
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : isOverdue(task.due_date)
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-green-100 hover:bg-green-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                        className="w-5 h-5"
                      />
                      <div>
                        <p className={`font-medium ${
                          task.completed ? "line-through text-gray-500" : "text-gray-900"
                        }`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`flex items-center text-xs ${
                            isOverdue(task.due_date) && !task.completed
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }`}>
                            {isOverdue(task.due_date) && !task.completed ? (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Calendar className="w-3 h-3 mr-1" />
                            )}
                            {formatDueDate(task.due_date)}
                          </span>
                          {task.priority && (
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          )}
                          {task.category && (
                            <Badge variant="outline" className="text-gray-600">
                              {task.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        onAddTask={handleAddTask}
        coupleId={selectedCoupleId}
        coupleName={selectedCouple ? `${selectedCouple.bride_name} & ${selectedCouple.groom_name}` : undefined}
      />
    </div>
  );
}
