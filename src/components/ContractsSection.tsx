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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileSignature,
  Eye,
  Send,
  Upload,
  Trash2,
  Download,
  ArrowLeft,
  FileText,
} from "lucide-react";
import {
  ContractUploadDialog,
  Contract as ContractUploadType,
} from "@/components/ContractUploadDialog";
import Link from "next/link";

interface Contract {
  id: number;
  user_id: string;
  couple_id: number | null;
  name: string;
  description: string | null;
  type: string;
  status: "draft" | "sent" | "signed" | "expired" | "pending";
  expiry_date: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  signedBy?: string;
  signedDate?: string;
  sentDate?: string;
  createdDate?: string;
  file?: {
    url: string;
    type: string;
  };
  signature?: string;
}

export function ContractsSection() {
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showContractUploadDialog, setShowContractUploadDialog] = useState(false);
  const [showContractViewerDialog, setShowContractViewerDialog] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [showSendContractDialog, setShowSendContractDialog] = useState(false);
  const [sendingContract, setSendingContract] = useState<Contract | null>(null);
  const [emailForm, setEmailForm] = useState({
    to: "",
    customEmail: "",
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch contracts when user changes
  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contracts:", error);
        setContracts([]);
        return;
      }

      if (!data || data.length === 0) {
        setContracts([]);
        return;
      }

      const mapped: Contract[] = data.map((c: any) => ({
        ...c,
        signedBy: c.status === "signed" ? "Client" : undefined,
        signedDate: c.status === "signed" && c.updated_at
          ? new Date(c.updated_at).toLocaleDateString()
          : undefined,
        sentDate: c.created_at
          ? new Date(c.created_at).toLocaleDateString()
          : undefined,
        createdDate: c.created_at
          ? new Date(c.created_at).toLocaleDateString()
          : undefined,
      }));

      setContracts(mapped);
    } catch (err) {
      console.error("Unexpected error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContractAction = async (contractId: number, action: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    switch (action) {
      case "view":
        if (contract.file_url) {
          window.open(contract.file_url, "_blank");
        } else {
          setViewingContract(contract);
          setShowContractViewerDialog(true);
        }
        break;

      case "delete":
        if (!confirm("Are you sure you want to delete this contract?")) return;

        try {
          const { error } = await supabase
            .from("contracts")
            .delete()
            .eq("id", contractId);

          if (error) {
            console.error("Error deleting contract:", error);
            alert("Failed to delete contract");
          } else {
            setContracts((prev) => prev.filter((c) => c.id !== contractId));
          }
        } catch (err) {
          console.error("Unexpected error:", err);
        }
        break;

      case "send":
        setSendingContract(contract);
        setEmailForm({
          to: "",
          customEmail: "",
          subject: `Contract: ${contract.name}`,
          body: `Please review and sign the attached contract: ${contract.name}`,
        });
        setShowSendContractDialog(true);
        break;
    }
  };

  const handleSendContractEmail = async () => {
    if (!sendingContract) return;

    const recipient = emailForm.to || emailForm.customEmail;
    if (!recipient.trim()) {
      alert("Please enter an email address.");
      return;
    }

    if (!emailForm.subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    // Update contract status to sent
    try {
      const { error } = await supabase
        .from("contracts")
        .update({ status: "sent" })
        .eq("id", sendingContract.id);

      if (error) {
        console.error("Error updating contract status:", error);
      }

      setContracts((prev) =>
        prev.map((c) =>
          c.id === sendingContract.id
            ? { ...c, status: "sent" as const, sentDate: new Date().toLocaleDateString() }
            : c
        )
      );

      setShowSendContractDialog(false);
      setSendingContract(null);
      setEmailForm({
        to: "",
        customEmail: "",
        subject: "",
        body: "",
      });

      alert(`Contract "${sendingContract.name}" has been sent successfully to ${recipient}!`);
    } catch (err) {
      console.error("Error sending contract:", err);
      alert("Failed to send contract.");
    }
  };

  const handleContractUploaded = async (
    contractData: Omit<ContractUploadType, "id" | "createdDate">
  ) => {
    try {
      if (!user) {
        alert("You must be signed in to upload a contract.");
        return;
      }

      const { data, error } = await supabase
        .from("contracts")
        .insert([{
          user_id: user.id,
          name: contractData.name,
          description: contractData.description || null,
          type: contractData.type,
          status: "draft",
          file_url: contractData.file?.url || "",
          file_type: contractData.file?.type || null,
          file_size: contractData.file?.size || null,
        }])
        .select()
        .single();

      if (error) {
        console.error("Error uploading contract:", error);
        alert("Failed to upload contract.");
        return;
      }

      const newContract: Contract = {
        ...data,
        createdDate: new Date().toLocaleDateString(),
      };

      setContracts((prev) => [newContract, ...prev]);
      setShowContractUploadDialog(false);

      alert(`Contract "${contractData.name}" uploaded successfully!`);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return { className: "bg-green-100 text-green-800", label: "Signed" };
      case "sent":
      case "pending":
        return { className: "bg-yellow-100 text-yellow-800", label: "Pending Signature" };
      case "expired":
        return { className: "bg-red-100 text-red-800", label: "Expired" };
      default:
        return { className: "bg-gray-100 text-gray-800", label: "Draft" };
    }
  };

  const getContractViewerContent = (contract: Contract) => {
    if (contract.file_url) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">📄</div>
          <p className="text-gray-600">Contract Document</p>
          <p className="font-medium text-xl">{contract.name}</p>
          <Button
            onClick={() => window.open(contract.file_url, "_blank")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            Open Document
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center space-y-6">
        <div className="text-6xl">📋</div>
        <div>
          <p className="text-gray-600 mb-2">Contract Information</p>
          <p className="font-medium text-xl">{contract.name}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg text-left max-w-2xl mx-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Contract Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <p className="text-gray-900 capitalize">{contract.type?.replace("_", " ")}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <p className="text-gray-900 capitalize">{contract.status}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <p className="text-gray-900">{contract.createdDate}</p>
            </div>
            {contract.signedDate && (
              <div>
                <span className="font-medium text-gray-700">Signed:</span>
                <p className="text-gray-900">{contract.signedDate}</p>
              </div>
            )}
            {contract.description && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-900">{contract.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileSignature className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contract Management</h1>
                <p className="text-amber-600 font-medium">Create, send, and track contracts</p>
              </div>
            </div>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => setShowContractUploadDialog(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Contract
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Card className="border-amber-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="text-amber-900">Your Contracts</CardTitle>
            <CardDescription>Manage all your ceremony contracts in one place</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileSignature className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No contracts yet</p>
                <p className="text-sm mt-2">Upload your first contract to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => {
                  const statusInfo = getStatusBadge(contract.status);
                  return (
                    <div
                      key={contract.id}
                      className="border border-amber-100 rounded-xl p-4 bg-white hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              contract.status === "signed"
                                ? "bg-green-100"
                                : contract.status === "sent" || contract.status === "pending"
                                ? "bg-yellow-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <FileSignature
                              className={`w-6 h-6 ${
                                contract.status === "signed"
                                  ? "text-green-600"
                                  : contract.status === "sent" || contract.status === "pending"
                                  ? "text-yellow-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{contract.name}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <Badge className={statusInfo.className}>
                                {statusInfo.label}
                              </Badge>
                              <p className="text-sm text-gray-500">
                                {contract.status === "signed" && contract.signedBy &&
                                  `Signed by ${contract.signedBy} on ${contract.signedDate}`}
                                {(contract.status === "sent" || contract.status === "pending") &&
                                  `Sent on ${contract.sentDate}`}
                                {contract.status === "draft" &&
                                  `Created on ${contract.createdDate}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => handleContractAction(contract.id, "view")}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleContractAction(contract.id, "delete")}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleContractAction(contract.id, "send")}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Contract Upload Dialog */}
      <ContractUploadDialog
        isOpen={showContractUploadDialog}
        onOpenChange={setShowContractUploadDialog}
        onContractUploaded={handleContractUploaded}
      />

      {/* Contract Viewer Dialog */}
      <Dialog open={showContractViewerDialog} onOpenChange={setShowContractViewerDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Contract</DialogTitle>
            <DialogDescription>Contract details and document</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewingContract && getContractViewerContent(viewingContract)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Contract Dialog */}
      <Dialog open={showSendContractDialog} onOpenChange={setShowSendContractDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Contract</DialogTitle>
            <DialogDescription>
              Send "{sendingContract?.name}" to the client for signature
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email-to">Recipient Email</Label>
              <Input
                id="email-to"
                type="email"
                value={emailForm.customEmail}
                onChange={(e) => setEmailForm({ ...emailForm, customEmail: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowSendContractDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendContractEmail} className="bg-green-500 hover:bg-green-600">
              <Send className="w-4 h-4 mr-2" />
              Send Contract
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
