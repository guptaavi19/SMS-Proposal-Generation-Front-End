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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/dropdown-menu";
import { parse } from "cookie";
import { isAxiosError } from "axios";
import { useAuth } from "~/hooks/use-auth";

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

  let cookies = parse(request.headers.get("cookie") || "");

  try {
    const [allSectionsRes, activeSectionRes] = await Promise.all([
      await http.get<GetSectionsResponse>(`/projects/${projectId}/sections`),
      await http.get<GetSectionResponse>(
        `/projects/${projectId}/sections/${sectionId}`
      ),
    ]);

    sections = allSectionsRes.data.data.sections;
    activeSection = activeSectionRes.data.data.section;
  } catch (e) {
    console.log(e);
  }

  return {
    projectId,
    sectionId,
    sections,
    activeSection,
    role: cookies.role as Role,
  };
};

type UpdateSectionResponse = {
  data: {
    section: Section;
  };
};

const Page = () => {
  const auth = useAuth();
  const { projectId, sectionId, sections, activeSection, role } =
    useLoaderData<typeof loader>();
  const [sectionContent, setSectionContent] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
  const [generatingSectionContent, setGeneratingSectionContent] = useState<{
    isGenerating: boolean;
    sectionName: string;
  }>({
    isGenerating: false,
    sectionName: "",
  });
  const navigate = useNavigate();
  const [visibleSections, setVisibleSections] = useState<string[]>(
    sections.map((section) => section.apiName)
  );

  const updateSection = useMutation({
    mutationFn: async ({
      section,
      userPrompt,
      isInitialGeneration,
      isAiRevision,
    }: {
      section: Section;
      userPrompt: string;
      isInitialGeneration: boolean;
      isAiRevision: boolean;
    }) => {
      const formData = new FormData();
      formData.append("user_prompt", userPrompt);
      formData.append("email", auth.email);

      if (isAiRevision) {
        formData.append("is_ai_revision", "yes");
      } else {
        formData.append("is_ai_revision", "no");
      }

      if (isInitialGeneration) {
        setGeneratingSectionContent({
          isGenerating: true,
          sectionName: section.displayName,
        });
      }

      const res = await http.post<UpdateSectionResponse>(
        `/projects/${projectId}/sections/${section.id}`,
        formData
      );

      return {
        res: res.data,
        isInitialGeneration,
        isAiRevision,
      };
    },
    onSuccess: async ({ res, isInitialGeneration, isAiRevision }) => {
      if (isInitialGeneration) {
        toast.success(`${res.data.section.displayName} draft generated!`);
      } else if (isAiRevision) {
        toast.success("AI revision applied!");
      } else {
        toast.success("Saved as draft!");
      }

      if (isInitialGeneration) {
        navigate(`/projects/${projectId}/sections/${res.data.section.id}`);
      } else {
        let htmlContent = await marked(res.data.section.response);
        setSectionContent(htmlContent);
        setUserPrompt("");
      }
    },
    onError: () => {
      toast.error("Something went wrong, please try again.");
    },
    onSettled: () => {
      setGeneratingSectionContent({
        isGenerating: false,
        sectionName: "",
      });
    },
  });

  const undoMutation = useMutation({
    mutationFn: async () => {
      const res = await http.delete<{ responseContent: string }>(
        `/projects/${projectId}/sections/${sectionId}/undo`
      );

      return res.data;
    },
    onSuccess: async ({ responseContent }) => {
      let htmlContent = await marked(responseContent);
      setSectionContent(htmlContent);
    },
    onError: (e) => {
      let msg = "Something went wrong, please try again.";

      if (isAxiosError<{ message: string }>(e) && e.response) {
        msg = e.response.data.message;
      }

      toast.error(msg);
    },
  });

  useEffect(() => {
    (async () => {
      if (activeSection) {
        let htmlContent = await marked(activeSection.response);
        setSectionContent(htmlContent);
      }
    })();
  }, [activeSection, sectionId]);

  useEffect(() => {
    if (generatingSectionContent.isGenerating) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [generatingSectionContent]);

  if (!activeSection) {
    // TODO: Improve this
    return <div>Not found.</div>;
  }

  return (
    <>
      {generatingSectionContent.isGenerating ? (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="mt-2 text-lg font-semibold">
              Generating content for {generatingSectionContent.sectionName}.
              Please wait...
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-12 min-h-screen p-4 gap-4 bg-slate-200">
        <div className="col-span-3 h-full">
          <Card className="h-full">
            <CardHeader>
              <div>
                <img src="/assets/logo.png" />
              </div>
              <div className="!mt-6">
                <div className="flex flex-row items-center">
                  <Link to="/" className="block">
                    <ChevronLeftCircle />
                  </Link>

                  <CardTitle className="text-xl ml-2">Sections</CardTitle>
                </div>
                <div className="inline-flex flex-col mt-4">
                  <Link to="/projects" className={buttonVariants()}>
                    View All Projects
                  </Link>
                  <Button
                    variant="outline"
                    className="mt-2"
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
                  let href = `/projects/${section.projectId}/sections/${section.id}`;

                  if (!visibleSections.includes(section.apiName)) return null;

                  return (
                    <div key={i}>
                      <Link
                        to={href}
                        onClick={(e) => {
                          e.preventDefault();

                          if (!section.response) {
                            updateSection.mutate({
                              section: section,
                              userPrompt: "",
                              isInitialGeneration: true,
                              isAiRevision: true,
                            });

                            return;
                          }

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
              <div className="flex flex-col items-center justify-center !mt-4 space-y-4">
                <Link
                  to={`/projects/${projectId}/sections/${sectionId}/audit`}
                  className={buttonVariants()}
                >
                  View Audit Log
                </Link>

                <Link
                  to={`/projects/${projectId}/sections/${sectionId}/prompt`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Edit Prompt
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-8">
                {isReadOnly ? (
                  <div className="bg-yellow-100 mb-4 px-4 py-3 flex items-center space-x-4 rounded-md">
                    <div className="flex-1">
                      Protected view is enabled. This is to prevent accidental
                      editing of content.
                    </div>
                    <div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsReadOnly(false);
                        }}
                      >
                        Enable Editing
                      </Button>
                    </div>
                  </div>
                ) : null}

                <ClientOnly
                  fallback={
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin h-10 w-10" />
                    </div>
                  }
                >
                  {() => (
                    <div>
                      <JoditEditor
                        value={sectionContent}
                        onBlur={(newContent) => setSectionContent(newContent)}
                        config={{
                          readonly: isReadOnly,
                          showPlaceholder: sectionContent.length === 0,
                        }}
                      />
                      {isReadOnly ? null : (
                        <div className="flex justify-end">
                          <Button
                            className="mt-4"
                            onClick={() => {
                              updateSection.mutate({
                                section: activeSection,
                                userPrompt: sectionContent,
                                isInitialGeneration: false,
                                isAiRevision: false,
                              });
                            }}
                            disabled={updateSection.isPending}
                          >
                            Save as Draft
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </ClientOnly>
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  disabled={isReadOnly || undoMutation.isPending}
                  onClick={() => {
                    undoMutation.mutate();
                  }}
                >
                  {undoMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Please wait
                    </>
                  ) : (
                    "Undo"
                  )}
                </Button>
              </div>

              <div className="mt-8">
                <Label>AI Prompt</Label>
                <Textarea
                  rows={5}
                  className="mt-2"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                />
              </div>
              <div className="mt-8 flex flex-col justify-center items-center space-y-3">
                <Button
                  onClick={() => {
                    updateSection.mutate({
                      section: activeSection,
                      userPrompt,
                      isInitialGeneration: false,
                      isAiRevision: true,
                    });
                  }}
                  disabled={updateSection.isPending || userPrompt.length === 0}
                >
                  {updateSection.isPending &&
                  !generatingSectionContent.isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Applying AI Revision
                    </>
                  ) : (
                    "Apply AI Revision"
                  )}
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
