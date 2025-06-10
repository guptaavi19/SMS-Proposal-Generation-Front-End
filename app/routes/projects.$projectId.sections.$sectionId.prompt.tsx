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
import { GetSectionsResponse, Role, Section } from "~/types";
import { marked } from "marked";
import JoditEditor from "~/components/jodit.client";
import { ClientOnly } from "remix-utils/client-only";
import { parse } from "cookie";
import { isAxiosError } from "axios";

type Params = {
  projectId: string;
  sectionId: string;
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
  let prompt: string = "";

  let cookies = parse(request.headers.get("cookie") || "");

  if (!cookies || !cookies.role) {
    throw redirect("/login");
  }

  try {
    const [allSectionsRes, activeSectionRes, promptRes] = await Promise.all([
      await http.get<GetSectionsResponse>(`/projects/${projectId}/sections`),
      await http.get<GetSectionResponse>(
        `/projects/${projectId}/sections/${sectionId}`
      ),
      await http.get<{ prompt: string; sectionName: string }>(
        `/projects/${projectId}/sections/${sectionId}/prompts`
      ),
    ]);

    sections = allSectionsRes.data.data.sections;
    activeSection = activeSectionRes.data.data.section;
    prompt = promptRes.data.prompt;
  } catch (e) {
    console.log(e);
  }

  return {
    projectId,
    sectionId,
    sections,
    activeSection,
    prompt,
    role: cookies.role as Role,
  };
};

const Page = () => {
  const { projectId, sectionId, sections, activeSection, ...loaderData } =
    useLoaderData<typeof loader>();
  const [prompt, setPrompt] = useState<string>(loaderData.prompt);
  const navigate = useNavigate();
  const [visibleSections] = useState<string[]>(
    sections.map((section) => section.apiName)
  );
  const editPromptMutation = useMutation({
    mutationFn: async ({ prompt }: { prompt: string }) => {
      await http.patch(`/projects/${projectId}/sections/${sectionId}/prompts`, {
        prompt,
      });
    },
    onSuccess: () => {
      toast.success("Prompt updated successfully.");
    },
    onError: () => {
      toast.error("Something went wrong, please try again.");
    },
  });

  useEffect(() => {
    setPrompt(loaderData.prompt);
  }, [loaderData.prompt]);

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
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `${
                            import.meta.env.VITE_API_URL
                          }/projects/${projectId}/are-all-sections-generated`
                        );
                        const data = await res.json();

                        if (data.are_all_sections_generated) {
                          navigate(`/projects/${projectId}/report-overview`, {
                            state: { mergedResponse: data.merged_response },
                          });
                        } else {
                          toast.error(
                            "Not all sections have been generated yet!"
                          );
                        }
                      } catch (error) {
                        console.error("Error checking sections:", error);
                        toast.error(
                          "Failed to fetch section status. Try again later."
                        );
                      }
                    }}
                  >
                    View Report Overview
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections.map((section, i) => {
                  let href = `/projects/${section.projectId}/sections/${section.id}/prompt`;

                  if (!visibleSections.includes(section.apiName)) return null;

                  return (
                    <div key={i}>
                      <Link
                        to={href}
                        onClick={(e) => {
                          navigate(href);
                        }}
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
                {activeSection.displayName}
              </CardTitle>
              <div className="flex flex-col items-center justify-center !mt-4">
                <Link
                  to={`/projects/${projectId}/sections/${sectionId}/audit`}
                  className={buttonVariants()}
                >
                  View Audit Log
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-8">
                <Label>Prompt</Label>
                <Textarea
                  rows={5}
                  className="mt-2"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="mt-8 flex flex-col justify-center items-center space-y-3">
                <Button
                  onClick={() => {
                    editPromptMutation.mutate({ prompt });
                  }}
                  disabled={editPromptMutation.isPending}
                >
                  {editPromptMutation.isPending ? "Saving" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Page;
