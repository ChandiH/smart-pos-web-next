"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Toast } from "@/components/ui";
import http from "@/services/httpService";

const EmailScheduler = () => {
  const [time, setTime] = useState("00:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await http.get<{ time?: string }>("/email/get-schedule");
        if (res.data?.time) setTime(res.data.time);
      } catch (err) {
        console.error(err);
        Toast.error("Unable to load email schedule. Please try again.");
      }
    };

    void fetchSchedule();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value);

  const handleSave = async () => {
    if (!time) return Toast.error("Please select a valid time.");
    setLoading(true);

    const promise = http.post("/email/set-schedule", { time });
    Toast.promise(promise, {
      loading: "Updating email schedule…",
      success: "✅ Schedule updated successfully!",
      error: "❌ Failed to update email schedule.",
    });

    try {
      await promise;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    setLoading(true);

    const promise = http.post("/email/send-now");
    Toast.promise(promise, {
      loading: "Sending email now…",
      success: "📧 Email sent successfully!",
      error: "❌ Failed to send email. Please try again.",
    });

    try {
      await promise;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">POS Email Scheduler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set the time for daily automatic email reports (24-hour format):
        </p>

        {/* ✅ Wrap everything to prevent overflow */}
        <div className="flex flex-col gap-3 w-full">
          <div className="w-full">
            <Input
              type="time"
              value={time}
              onChange={handleChange}
              disabled={loading}
              className="w-full min-w-[160px] px-2 py-1"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 whitespace-nowrap"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Schedule
            </Button>

            <Button
              onClick={handleSendNow}
              variant="outline"
              disabled={loading}
              className="flex-1 whitespace-nowrap"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailScheduler;
