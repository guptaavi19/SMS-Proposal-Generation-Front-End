import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeftCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { http } from "~/lib/utils";
import { GetSectionsResponse, Role, Section, User } from "~/types";
import { marked } from "marked";
import JoditEditor from "~/components/jodit.client";
import { ClientOnly } from "remix-utils/client-only";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/dropdown-menu";
import { parse } from "cookie";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

type Params = {
  projectId: string;
  sectionId: string;
};

type AuditLog = {
  id: string;
  userId: string;
  newPrompt: string;
  newResponse: string;
  oldPrompt: string;
  oldResponse: string;
  timestamp: string;
  version: string;
};

type GetSectionResponse = {
  data: {
    section: Section;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { projectId, sectionId } = params as Params;
  let sections: Section[] = [];
  let activeSection: Section | null = null;
  let auditLogs: AuditLog[] = [];
  let users: User[] = [];

  let cookies = parse(request.headers.get("cookie") || "");

  try {
    const [allSectionsRes, activeSectionRes, auditRes] = await Promise.all([
      await http.get<GetSectionsResponse>(`/projects/${projectId}/sections`),
      await http.get<GetSectionResponse>(
        `/projects/${projectId}/sections/${sectionId}`
      ),
      await http.get<{ history: AuditLog[]; users: User[] }>(
        `/projects/${projectId}/sections/${sectionId}/audit`
      ),
    ]);

    sections = allSectionsRes.data.data.sections;
    activeSection = activeSectionRes.data.data.section;
    auditLogs = auditRes.data.history;
    users = auditRes.data.users;
  } catch (e) {
    console.log(e);
  }

  return {
    projectId,
    sectionId,
    sections,
    activeSection,
    auditLogs,
    users,
    role: cookies.role as Role,
  };
};

type UpdateSectionResponse = {
  data: {
    section: Section;
  };
};

const renderLargeContent = (content: string) => {
  if (content.length === 0) {
    return "N/A";
  }

  if (content.length > 200) {
    return content.slice(0, 200) + "...";
  }

  return content;
};

const Page = () => {
  const { projectId, sectionId, sections, activeSection, auditLogs, users } =
    useLoaderData<typeof loader>();

  if (!activeSection) {
    // TODO: Improve this
    return <div>Not found.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-12 min-h-screen p-4 gap-4 bg-slate-200">
        <div className="col-span-3 h-full">
          <Card className="h-full">
            <CardHeader>
              <div>
                <img src="/assets/logo.png" />
              </div>
              <div className="!mt-6">
                <div className="flex flex-row items-center">
                  <Link
                    to={`/projects/${projectId}/sections/${sectionId}`}
                    className="block"
                  >
                    <ChevronLeftCircle />
                  </Link>

                  <CardTitle className="text-xl ml-2">Sections</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections.map((section, i) => {
                  let href = `/projects/${section.projectId}/sections/${section.id}/audit`;

                  return (
                    <div key={i}>
                      <Link
                        to={href}
                        className={buttonVariants({
                          variant:
                            sectionId === section.id ? "default" : "ghost",
                          className: "w-full !justify-start rounded-lg",
                        })}
                      >
                        {section.displayName}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {activeSection.displayName} - Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Revised By</TableHead>
                    <TableHead>Previous Prompt</TableHead>
                    <TableHead>Previous Content</TableHead>
                    <TableHead>Revised Prompt</TableHead>
                    <TableHead>Revised Content</TableHead>
                    <TableHead>Revision Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((row, i) => {
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {renderLargeContent(row.version)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const user = users.find(
                              (user) => user.id === row.userId
                            );
                            if (!user) {
                              return "N/A";
                            }

                            return renderLargeContent(user.email);
                          })()}
                        </TableCell>
                        <TableCell>
                          {renderLargeContent(row.oldPrompt)}
                        </TableCell>
                        <TableCell>
                          {renderLargeContent(row.oldResponse)}
                        </TableCell>
                        <TableCell>
                          {renderLargeContent(row.newPrompt)}
                        </TableCell>
                        <TableCell>
                          {renderLargeContent(row.newResponse)}
                        </TableCell>
                        <TableCell>
                          {renderLargeContent(row.timestamp)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Page;
