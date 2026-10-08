"use client";
import React, { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Crop,
  Image as ImageUpscale, // no lucide-react upscale, using Image icon
  ImageMinus,
  Loader2Icon,
  Images,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  selectedEl: HTMLImageElement;
};

const transformOptions = [
  { label: "Smart Crop", value: "smartcrop", icon: <Crop />, transformation: 'fo-auto'},
  { label: "Drop Shadow", value: "dropshadow", icon: <Images />, transformation: 'e-dropshadow' },
  { label: "Upscale", value: "upscale", icon: <ImageUpscale />, transformation: 'e-upscale' },
  { label: "BG Remove", value: "bgremove", icon: <ImageMinus />, transformation: 'e-bgremove'},
];

function ImageSettingSection({ selectedEl }: Props) {
  const [altText, setAltText] = useState(selectedEl.alt || "");
  const [selectedImage, setSelectedImage] = useState<File>();
  const [loading, setLoading] = useState<boolean>(false);
  const [borderRadius, setBorderRadius] = useState(
    selectedEl.style.borderRadius || "0px"
  );
  const [preview, setPreview] = useState(selectedEl.src || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateImageSrc = (url: string) => {
    setPreview(url);
    selectedEl.setAttribute('src', url);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveUploadedFile = async ()=> {
    if(selectedImage){
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedImage);
        const result = await axios.post("/api/upload-image", formData);
        // "?tr=" lets ImageKit transformations be appended later
        updateImageSrc(result.data.url+"?tr=");
      } catch {
        toast.error("Image upload failed");
      }
      setLoading(false);
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const GenerateAIImage= ()=> {
    setLoading(true);
    updateImageSrc(`${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodeURIComponent(altText)}/${Date.now()}.png?tr=`);
  }

  // Toggles an ImageKit transformation in the URL's ?tr= list
  const ApplyTransformation= (trValue: string)=> {
    if (!preview.includes('?tr=')) {
      toast.error("Upload or generate an image first to apply AI transforms");
      return;
    }
    setLoading(true);
    if(preview.includes(trValue + ',')) {
      updateImageSrc(preview.replaceAll(trValue + ',', ''));
    } else {
      updateImageSrc(preview + trValue + ',');
    }
  }

  return (
  <div className="w-96 shadow p-4 space-y-4">
    <h2 className="flex gap-2 items-center font-bold">
      <ImageIcon /> Image Settings
    </h2>

    {/* Preview (clickable) */}
    <div className="flex justify-center">
      <img
        src={preview}
        alt={altText}
        className="max-h-40 object-contain border rounded cursor-pointer hover:opacity-80"
        onClick={openFileDialog}
        onLoad={()=>setLoading(false)}
        onError={()=>setLoading(false)}
      />
    </div>

    {/* Hidden file input */}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      ref={fileInputRef}
      onChange={handleFileChange}
    />

    {/* Upload Button */}
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={saveUploadedFile}
      disabled={loading}
    >
      {loading && <Loader2Icon className="animate-spin"/>}Upload Image
    </Button>

    {/* Alt text */}
    <div>
      <label className="text-sm">Prompt</label>
      <Input
        type="text"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        placeholder="Enter alt text"
        className="mt-1"
      />
    </div>

    <Button className="w-full" onClick={GenerateAIImage} disabled={loading}>
      {loading && <Loader2Icon className="animate-spin"/>}Generate AI Image
    </Button>

    {/* Transform Buttons */}
    <div>
      <label className="text-sm mb-1 block">AI Transform</label>
      <div className="flex gap-2 flex-wrap">
        <TooltipProvider>
          {transformOptions.map((opt) => {
            return (
              <Tooltip key={opt.value}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={preview.includes(opt.transformation + ",") ? 'default' : 'outline'}
                    className="flex items-center justify-center p-2"
                    onClick={() => ApplyTransformation(opt.transformation)}
                  >
                    {opt.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {opt.label} {preview.includes(opt.transformation + ",") && "(Applied)"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>

        {/* Border Radius */}
        <div>
      <label className="text-sm">Border Radius</label>
      <Input
        type="text"
        value={borderRadius}
        onChange={(e) => { setBorderRadius(e.target.value); selectedEl.style.borderRadius = e.target.value; }}
        placeholder="e.g. 8px or 50%"
        className="mt-1"
      />
    </div>
  </div>
 );
}

export default ImageSettingSection;
