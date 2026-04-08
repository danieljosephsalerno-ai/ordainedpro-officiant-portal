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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CreditCard,
  Receipt,
  Clock,
  Check,
  AlertCircle,
  Mail,
  Plus,
  FileText,
  TrendingUp,
  ArrowLeft,
  Users,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface Couple {
  id: number;
  bride_name: string;
  groom_name: string;
  bride_email: string;
  groom_email: string;
}

interface PaymentInfo {
  totalAmount: number;
  depositPaid: number;
  balance: number;
  finalPaymentDue: string;
}

interface PaymentRecord {
  id: number;
  couple_id: number;
  type: string;
  amount: number;
  date: string;
  method: string;
  status: "completed" | "pending";
  notes?: string;
}

export function PaymentsSection() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Couple selection state
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<number | null>(null);
  const [selectedCouple, setSelectedCouple] = useState<Couple | null>(null);

  // Dialog states
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [showPaymentReminderDialog, setShowPaymentReminderDialog] = useState(false);

  // Payment data for SELECTED couple only
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    totalAmount: 0,
    depositPaid: 0,
    balance: 0,
    finalPaymentDue: "Not set",
  });

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

  const [newPayment, setNewPayment] = useState({
    amount: "",
    method: "Credit Card",
    notes: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    items: [{ description: "Wedding Ceremony Services", amount: "0" }],
    notes: "Thank you for choosing our services!",
    dueDate: "",
  });

  const [reminderForm, setReminderForm] = useState({
    to: "",
    subject: "Payment Reminder - Wedding Ceremony",
    body: "",
  });

  // Aggregate earnings across ALL couples (for summary stats)
  const [allCouplesPayments, setAllCouplesPayments] = useState<PaymentRecord[]>([]);
  const [myScripts, setMyScripts] = useState<any[]>([]);

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
      fetchAllPaymentsForEarnings();
      fetchScripts();
    }
  }, [user]);

  // Fetch payments when selected couple changes
  useEffect(() => {
    if (selectedCoupleId && user) {
      fetchPaymentsForCouple(selectedCoupleId);
      // Update selected couple object
      const couple = couples.find(c => c.id === selectedCoupleId);
      setSelectedCouple(couple || null);
    } else {
      // Clear payment data when no couple selected
      setPaymentHistory([]);
      setPaymentInfo({
        totalAmount: 0,
        depositPaid: 0,
        balance: 0,
        finalPaymentDue: "Not set",
      });
      setSelectedCouple(null);
    }
  }, [selectedCoupleId, couples]);

  const fetchCouples = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("couples")
        .select("id, bride_name, groom_name, bride_email, groom_email")
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

  // Fetch payments for a SPECIFIC couple only
  const fetchPaymentsForCouple = async (coupleId: number) => {
    if (!user || !coupleId) return;

    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .eq("couple_id", coupleId)  // ⚠️ CRITICAL: Filter by couple_id
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
        setPaymentHistory([]);
        return;
      }

      const payments: PaymentRecord[] = (data || []).map((p: any) => ({
        id: p.id,
        couple_id: p.couple_id,
        type: p.type || "Payment",
        amount: p.amount || 0,
        date: p.paid_date || p.created_at,
        method: p.payment_method || "Unknown",
        status: p.status === "paid" ? "completed" : "pending",
        notes: p.notes,
      }));

      setPaymentHistory(payments);

      // Calculate payment summary for this couple
      const totalPaid = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingAmount = payments
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

      // Fetch ceremony info for total amount (if available)
      const { data: ceremony } = await supabase
        .from("ceremonies")
        .select("total_cost, deposit_amount, final_payment_due")
        .eq("couple_id", coupleId)
        .single();

      const totalAmount = ceremony?.total_cost || totalPaid + pendingAmount;

      setPaymentInfo({
        totalAmount: totalAmount,
        depositPaid: totalPaid,
        balance: Math.max(0, totalAmount - totalPaid),
        finalPaymentDue: ceremony?.final_payment_due || "2 weeks before ceremony",
      });

    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch ALL payments for earnings overview (across all couples)
  const fetchAllPaymentsForEarnings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        setAllCouplesPayments(data.map((p: any) => ({
          id: p.id,
          couple_id: p.couple_id,
          type: p.type || "Payment",
          amount: p.amount || 0,
          date: p.paid_date || p.created_at,
          method: p.payment_method || "Unknown",
          status: p.status === "paid" ? "completed" : "pending",
        })));
      }
    } catch (err) {
      console.error("Error fetching all payments:", err);
    }
  };

  const fetchScripts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        setMyScripts(data);
      }
    } catch (err) {
      console.error("Error fetching scripts:", err);
    }
  };

  const handleRecordPayment = async () => {
    if (!newPayment.amount || !selectedCoupleId) {
      alert(selectedCoupleId ? "Please enter an amount" : "Please select a couple first");
      return;
    }

    const amount = parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          couple_id: selectedCoupleId,  // ⚠️ CRITICAL: Include couple_id
          amount: amount,
          type: "Payment",
          status: "paid",
          payment_method: newPayment.method,
          notes: newPayment.notes || null,
          paid_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error recording payment:", error);
        alert("Failed to record payment. Please try again.");
        return;
      }

      // Refresh payments for this couple
      fetchPaymentsForCouple(selectedCoupleId);
      fetchAllPaymentsForEarnings();

      setNewPayment({ amount: "", method: "Credit Card", notes: "" });
      setShowRecordPaymentDialog(false);
      alert("Payment recorded successfully!");
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
    }
  };

  const handleGenerateInvoice = () => {
    if (!selectedCouple) {
      alert("Please select a couple first");
      return;
    }
    alert(`Invoice generated for ${selectedCouple.bride_name} & ${selectedCouple.groom_name}!`);
    setShowInvoiceDialog(false);
  };

  const handleSendReminder = () => {
    if (!reminderForm.to) {
      alert("Please enter a recipient email");
      return;
    }
    alert(`Payment reminder sent to ${reminderForm.to}`);
    setShowPaymentReminderDialog(false);
  };

  // Earnings calculations using ALL couples' payments
  const calculateYTDEarnings = () => {
    const currentYear = new Date().getFullYear();
    const coupleEarnings = allCouplesPayments
      .filter((p) => p.status === "completed")
      .filter((p) => new Date(p.date).getFullYear() === currentYear)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const scriptEarnings = myScripts.reduce(
      (sum, script) => sum + (script.earnings || 0),
      0
    );

    return coupleEarnings + scriptEarnings;
  };

  const calculateMTDEarnings = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return allCouplesPayments
      .filter((p) => p.status === "completed")
      .filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === currentMonth &&
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const calculatePendingPayments = () => {
    return allCouplesPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

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
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payments & Invoices</h1>
                <p className="text-green-600 font-medium">Track payments and manage earnings</p>
              </div>
            </div>
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
                  if (selectedCoupleId) fetchPaymentsForCouple(selectedCoupleId);
                }}
                className="text-blue-600 border-blue-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              View and manage payments for a specific couple
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCoupleId?.toString() || ""}
              onValueChange={(value) => setSelectedCoupleId(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-96 border-blue-200">
                <SelectValue placeholder="Choose a couple to view their payments..." />
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
                <span className="font-medium">Viewing payments for:</span>{" "}
                {selectedCouple.bride_name} & {selectedCouple.groom_name}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Overview & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Overview for Selected Couple */}
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-blue-900">
                      {selectedCouple
                        ? `Payment Overview - ${selectedCouple.bride_name} & ${selectedCouple.groom_name}`
                        : "Payment Overview"
                      }
                    </CardTitle>
                    {paymentInfo.balance === 0 && selectedCouple && (
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md">
                        <Check className="w-3 h-3 mr-1" />
                        Paid in Full
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInvoiceDialog(true)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      disabled={!selectedCoupleId}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Invoice
                    </Button>
                    {paymentInfo.balance > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setShowRecordPaymentDialog(true)}
                        className="bg-green-500 hover:bg-green-600"
                        disabled={!selectedCoupleId}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Record Payment
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {selectedCouple
                    ? "Track ceremony payments and outstanding balances for this couple"
                    : "Select a couple above to view their payment details"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!selectedCoupleId ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Please select a couple to view their payment details</p>
                  </div>
                ) : loadingPayments ? (
                  <div className="text-center py-8 text-gray-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                    <p>Loading payment data...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">Total Amount</p>
                            <p className="text-2xl font-bold text-green-900">
                              ${paymentInfo.totalAmount.toLocaleString()}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Amount Paid</p>
                            <p className="text-2xl font-bold text-blue-900">
                              ${paymentInfo.depositPaid.toLocaleString()}
                            </p>
                          </div>
                          <CreditCard className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      <div className={`rounded-xl p-4 border ${
                        paymentInfo.balance > 0
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
                          : "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${
                              paymentInfo.balance > 0 ? "text-orange-800" : "text-green-800"
                            }`}>
                              Balance Due
                            </p>
                            <p className={`text-2xl font-bold ${
                              paymentInfo.balance > 0 ? "text-orange-900" : "text-green-900"
                            }`}>
                              ${paymentInfo.balance.toLocaleString()}
                            </p>
                          </div>
                          {paymentInfo.balance > 0 ? (
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                          ) : (
                            <Check className="w-8 h-8 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div>
                        <p className="font-semibold text-blue-900">Final Payment Due</p>
                        <p className="text-sm text-blue-700">{paymentInfo.finalPaymentDue}</p>
                      </div>
                      {paymentInfo.balance > 0 && selectedCouple && (
                        <Button
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() => {
                            setReminderForm({
                              ...reminderForm,
                              to: selectedCouple.bride_email || selectedCouple.groom_email || "",
                            });
                            setShowPaymentReminderDialog(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Payment Reminder
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment History for Selected Couple */}
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-blue-900">
                  Payment History
                  {selectedCouple && (
                    <span className="text-sm font-normal text-blue-600 ml-2">
                      ({selectedCouple.bride_name} & {selectedCouple.groom_name})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Track all payments and transactions for this couple</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {!selectedCoupleId ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a couple to view their payment history</p>
                    </div>
                  ) : loadingPayments ? (
                    <div className="text-center py-8 text-gray-500">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                      <p>Loading...</p>
                    </div>
                  ) : paymentHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No payment history yet for this couple</p>
                    </div>
                  ) : (
                    paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border border-blue-100 rounded-xl bg-white"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            payment.status === "completed" ? "bg-green-100" : "bg-orange-100"
                          }`}>
                            {payment.status === "completed" ? (
                              <Receipt className="w-6 h-6 text-green-600" />
                            ) : (
                              <Clock className="w-6 h-6 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{payment.type}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.date).toLocaleDateString()} • {payment.method}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ${payment.amount.toLocaleString()}
                          </p>
                          <Badge className={
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }>
                            {payment.status === "completed" ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Earnings */}
          <div className="space-y-6">
            {/* Payment Actions */}
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-blue-900">Payment Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <Button
                  className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowInvoiceDialog(true)}
                  disabled={!selectedCoupleId}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
                <Button
                  className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowPaymentReminderDialog(true)}
                  disabled={!selectedCoupleId}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Payment Reminder
                </Button>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3 text-blue-900">Payment Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Status:</span>
                      <Badge className={paymentInfo.depositPaid > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {paymentInfo.depositPaid > 0 ? "Received" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final Payment:</span>
                      <Badge className={paymentInfo.balance > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                        {paymentInfo.balance > 0 ? "Pending" : "Paid"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings Overview - Aggregate across ALL couples */}
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-blue-900">Total Earnings Overview</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Aggregate earnings from all couples and scripts
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Year to Date Earnings */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-green-800">Year to Date (YTD)</p>
                        <p className="text-2xl font-bold text-green-900">
                          ${calculateYTDEarnings().toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  {/* Month to Date Earnings */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Month to Date (MTD)</p>
                        <p className="text-2xl font-bold text-blue-900">
                          ${calculateMTDEarnings().toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>

                  {/* Pending Payments */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-800">Pending Payments</p>
                        <p className="text-2xl font-bold text-amber-900">
                          ${calculatePendingPayments().toLocaleString()}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordPaymentDialog} onOpenChange={setShowRecordPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedCouple
                ? `Record a payment from ${selectedCouple.bride_name} & ${selectedCouple.groom_name}`
                : "Enter the payment details"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={newPayment.method}
                onValueChange={(value) => setNewPayment({ ...newPayment, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Venmo">Venmo</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRecordPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} className="bg-green-500 hover:bg-green-600">
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              {selectedCouple
                ? `Create an invoice for ${selectedCouple.bride_name} & ${selectedCouple.groom_name}`
                : "Create an invoice for the ceremony services"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Invoice Items</h4>
              {invoiceForm.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.description}</span>
                  <span className="font-medium">${paymentInfo.totalAmount || item.amount}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${paymentInfo.totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 mt-1">
                <span>Paid</span>
                <span>-${paymentInfo.depositPaid}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-orange-600">
                <span>Balance Due</span>
                <span>${paymentInfo.balance}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invoice-notes">Notes</Label>
              <Textarea
                id="invoice-notes"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice} className="bg-blue-500 hover:bg-blue-600">
              Generate Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Reminder Dialog */}
      <Dialog open={showPaymentReminderDialog} onOpenChange={setShowPaymentReminderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>Send a friendly reminder about the outstanding balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reminder-to">Recipient Email</Label>
              <Input
                id="reminder-to"
                type="email"
                value={reminderForm.to}
                onChange={(e) => setReminderForm({ ...reminderForm, to: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label htmlFor="reminder-subject">Subject</Label>
              <Input
                id="reminder-subject"
                value={reminderForm.subject}
                onChange={(e) => setReminderForm({ ...reminderForm, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="reminder-body">Message</Label>
              <Textarea
                id="reminder-body"
                value={reminderForm.body}
                onChange={(e) => setReminderForm({ ...reminderForm, body: e.target.value })}
                rows={4}
                placeholder="Enter your reminder message..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowPaymentReminderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReminder} className="bg-blue-500 hover:bg-blue-600">
              <Mail className="w-4 h-4 mr-2" />
              Send Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
