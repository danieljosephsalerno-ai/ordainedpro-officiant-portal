"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save } from "lucide-react";

export interface NewCeremonyData {
  ceremonyName: string;
  ceremonyDate: string;
  ceremonyTime: string;
  venueName: string;
  venueAddress: string;
  expectedGuests: string;
  brideName: string;
  brideEmail: string;
  bridePhone: string;
  brideAddress: string;
  groomName: string;
  groomEmail: string;
  groomPhone: string;
  groomAddress: string;
  totalAmount: string;
  depositAmount: string;
  finalPaymentDate: string;
  notes: string;
}

const initialCeremonyState: NewCeremonyData = {
  ceremonyName: "",
  ceremonyDate: "",
  ceremonyTime: "",
  venueName: "",
  venueAddress: "",
  expectedGuests: "",
  brideName: "",
  brideEmail: "",
  bridePhone: "",
  brideAddress: "",
  groomName: "",
  groomEmail: "",
  groomPhone: "",
  groomAddress: "",
  totalAmount: "",
  depositAmount: "",
  finalPaymentDate: "",
  notes: "",
};

export interface AddCeremonyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCeremony: (ceremony: NewCeremonyData) => Promise<void>;
  showTriggerButton?: boolean;
}

export function AddCeremonyDialog({
  open,
  onOpenChange,
  onAddCeremony,
  showTriggerButton = true,
}: AddCeremonyDialogProps) {
  const [newCeremony, setNewCeremony] = useState<NewCeremonyData>(initialCeremonyState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onAddCeremony(newCeremony);
      // Reset form after successful submission
      setNewCeremony(initialCeremonyState);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewCeremony(initialCeremonyState);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTriggerButton && (
        <DialogTrigger asChild>
          <Button
            size="default"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Ceremony
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Wedding Ceremony</DialogTitle>
          <DialogDescription>
            Fill in the details for the new wedding ceremony you'll be
            officiating.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Ceremony Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">
              Ceremony Details
            </h3>

            <div>
              <Label htmlFor="ceremonyName">Ceremony Name</Label>
              <Input
                id="ceremonyName"
                value={newCeremony.ceremonyName}
                onChange={(e) =>
                  setNewCeremony({
                    ...newCeremony,
                    ceremonyName: e.target.value,
                  })
                }
                placeholder="e.g., Sarah & David's Wedding"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="ceremonyDate">Date</Label>
                <Input
                  id="ceremonyDate"
                  type="date"
                  value={newCeremony.ceremonyDate}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      ceremonyDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="ceremonyTime">Time</Label>
                <Input
                  id="ceremonyTime"
                  type="time"
                  value={newCeremony.ceremonyTime}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      ceremonyTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                value={newCeremony.venueName}
                onChange={(e) =>
                  setNewCeremony({
                    ...newCeremony,
                    venueName: e.target.value,
                  })
                }
                placeholder="e.g., Sunset Gardens"
              />
            </div>

            <div>
              <Label htmlFor="venueAddress">Venue Address</Label>
              <Textarea
                id="venueAddress"
                value={newCeremony.venueAddress}
                onChange={(e) =>
                  setNewCeremony({
                    ...newCeremony,
                    venueAddress: e.target.value,
                  })
                }
                placeholder="Full venue address"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="expectedGuests">Expected Guests</Label>
              <Input
                id="expectedGuests"
                type="number"
                value={newCeremony.expectedGuests}
                onChange={(e) =>
                  setNewCeremony({
                    ...newCeremony,
                    expectedGuests: e.target.value,
                  })
                }
                placeholder="Number of guests"
              />
            </div>
          </div>

          {/* Couple Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">
              Couple Information
            </h3>

            {/* Bride Information */}
            <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="font-medium text-pink-900 mb-3">
                Bride Information
              </h4>
              <div className="space-y-3">
                <Input
                  value={newCeremony.brideName}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      brideName: e.target.value,
                    })
                  }
                  placeholder="Bride's full name"
                />
                <Input
                  type="email"
                  value={newCeremony.brideEmail}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      brideEmail: e.target.value,
                    })
                  }
                  placeholder="Bride's email"
                />
                <Input
                  type="tel"
                  value={newCeremony.bridePhone}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      bridePhone: e.target.value,
                    })
                  }
                  placeholder="Bride's phone"
                />
                <Input
                  value={newCeremony.brideAddress}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      brideAddress: e.target.value,
                    })
                  }
                  placeholder="Bride's primary address"
                />
              </div>
            </div>

            {/* Groom Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">
                Groom Information
              </h4>
              <div className="space-y-3">
                <Input
                  value={newCeremony.groomName}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      groomName: e.target.value,
                    })
                  }
                  placeholder="Groom's full name"
                />
                <Input
                  type="email"
                  value={newCeremony.groomEmail}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      groomEmail: e.target.value,
                    })
                  }
                  placeholder="Groom's email"
                />
                <Input
                  type="tel"
                  value={newCeremony.groomPhone}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      groomPhone: e.target.value,
                    })
                  }
                  placeholder="Groom's phone"
                />
                <Input
                  value={newCeremony.groomAddress}
                  onChange={(e) =>
                    setNewCeremony({
                      ...newCeremony,
                      groomAddress: e.target.value,
                    })
                  }
                  placeholder="Groom's primary address"
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3">
                Payment Information
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={newCeremony.totalAmount}
                    onChange={(e) =>
                      setNewCeremony({
                        ...newCeremony,
                        totalAmount: e.target.value,
                      })
                    }
                    placeholder="Total amount ($)"
                  />
                  <Input
                    type="number"
                    value={newCeremony.depositAmount}
                    onChange={(e) =>
                      setNewCeremony({
                        ...newCeremony,
                        depositAmount: e.target.value,
                      })
                    }
                    placeholder="Deposit ($)"
                  />
                </div>
                <div>
                  <Label htmlFor="finalPaymentDate">Final Payment Due</Label>
                  <Input
                    id="finalPaymentDate"
                    type="date"
                    value={newCeremony.finalPaymentDate}
                    onChange={(e) =>
                      setNewCeremony({
                        ...newCeremony,
                        finalPaymentDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <Label htmlFor="ceremonyNotes">Additional Notes</Label>
          <Textarea
            id="ceremonyNotes"
            value={newCeremony.notes}
            onChange={(e) =>
              setNewCeremony({
                ...newCeremony,
                notes: e.target.value,
              })
            }
            placeholder="Any special requests, cultural traditions, or important notes about this ceremony..."
            rows={4}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Ceremony"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
