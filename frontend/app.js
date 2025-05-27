(function ($) {
    const apiGatewayBaseUrl = "https://bl19s75389.execute-api.us-east-1.amazonaws.com/prod";
    const cloudfrontBaseUrl = "https://image-resizer.fozdigitalz.com";

    const resizeOptionsGrouped = [
        {
          groupName: "Social Media Sizes",
          options: [
            { platform: "Instagram 📸", label: "Post", size: "1080x1080" },
            { platform: "Facebook 📘", label: "Shared Image", size: "1200x630" },
            { platform: "Twitter/X 🐦", label: "Summary Image", size: "1200x675" },
            { platform: "LinkedIn 💼", label: "Shared Link Image", size: "1200x627" },
            { platform: "YouTube ▶️", label: "Thumbnail", size: "1280x720" }
          ]
        },
        {
          groupName: "Standard Sizes",
          options: [
            { platform: "Thumbnail 🖼️", label: "", size: "150x150" },
            { platform: "Small Preview", label: "", size: "320x240" },
            { platform: "Medium Display", label: "", size: "640x480" },
            { platform: "Large Display", label: "", size: "800x600" },
            { platform: "Full HD", label: "", size: "1920x1080" }
          ]
        }
      ];
      

    const defaultUrls = {
        presign: `${apiGatewayBaseUrl}/presign`,
        list: `${apiGatewayBaseUrl}/list`,
        delete: `${apiGatewayBaseUrl}/delete`,
        resize: `${apiGatewayBaseUrl}/resize`
    };

    $(document).ready(function () {
        $("#functionUrlPresign").val(defaultUrls.presign);
        $("#functionUrlList").val(defaultUrls.list);
        $("#functionUrlDelete").val(defaultUrls.delete);
        $("#functionUrlResize").val(defaultUrls.resize);

        const $resizeSelect = $("#resizeOption");

        // Clear existing options
        $resizeSelect.empty();
        $resizeSelect.append(`<option value="">-- Choose Size --</option>`);

        // Build grouped options
        resizeOptionsGrouped.forEach(group => {
        const $group = $(`<optgroup label="${group.groupName}"></optgroup>`);
        
        group.options.forEach(opt => {
            const labelText = opt.label ? `${opt.platform} ${opt.label}` : opt.platform;
            $group.append(`<option value="${opt.size}">${labelText} (${opt.size})</option>`);
        });

        $resizeSelect.append($group);
        });

        // Activate Select2
        $resizeSelect.select2({
        placeholder: "-- Choose Size --",
        width: '100%',
        templateResult: function (state) {
            if (!state.id) return state.text;
            return $('<span>' + state.text + '</span>');
        },
        templateSelection: function (state) {
            if (!state.id) return state.text;
            return $('<span>' + state.text + '</span>');
        }
        });

    });

    $("#functionUrlPresign").click(async function () {
        const fileInput = $("#customFile")[0].files[0];
        if (!fileInput) return alert("Please select a file first.");

        const fileName = encodeURIComponent(fileInput.name);
        const resizeSize = $("#resizeOption").val();

        try {
            const response = await $.ajax({
                url: `${defaultUrls.presign}?fileName=${fileName}&resizeSize=${resizeSize}`,
                method: "GET",
                dataType: "json"
            });

            if (!response || !response.url) throw new Error("Missing presigned URL");

            $("#functionUrlPresign").val(response.url).trigger("change");
            $("#presignUrlDisplay").val(response.url);
            navigator.clipboard.writeText(response.url);
            localStorage.setItem("functionUrlPresign", response.url);
        } catch (err) {
            console.error("Presign error:", err);
            alert("Failed to generate presign URL.");
        }
    });

    $("#uploadForm").submit(async function (e) {
        e.preventDefault();
        $("#uploadForm button").addClass("disabled");

        const file = $("#customFile")[0].files[0];
        const presignedUrl = $("#functionUrlPresign").val();

        if (!file || !presignedUrl) {
            alert("Missing file or presign URL.");
            $("#uploadForm button").removeClass("disabled");
            return;
        }

        try {
            const response = await fetch(presignedUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type
                }
            });

            if (!response.ok) throw new Error("Upload failed");
            const toast = new bootstrap.Toast(document.getElementById('uploadSuccessToast'));
            toast.show();
            
            // Clear file input after successful upload
            $("#customFile").val(""); // Reset file input


        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload failed.");
        } finally {
            $("#uploadForm button").removeClass("disabled");
        }
    });

    $("#loadImageListButton").click(async function () {
        try {
            const response = await fetch(defaultUrls.list);
            const images = await response.json();
            const container = $("#imagesContainer").empty();

            if (!Array.isArray(images) || images.length === 0) {
                container.append("<p>No images found.</p>");
                return;
            }

            images.forEach(img => {
                const s3Key = img.Name;

                // Extract just the filename from the key: "uploads/Instance-Metrics.png" → "Instance-Metrics.png"
                const fileName = s3Key.split("/").pop();

                const selectedSize = $("#resizeOption").val() || "800x600";
                const originalUrl = `${cloudfrontBaseUrl}/uploads/${encodeURIComponent(fileName)}`;
                const resizedUrl = `${cloudfrontBaseUrl}/resized-${selectedSize}/uploads/${encodeURIComponent(fileName)}`;

                const html = `
                    <div class="image-item">
                        <p><strong>${fileName}</strong></p>
                        <a href="${originalUrl}" target="_blank">View Original</a> |
                        <a href="${resizedUrl}" target="_blank">Download Resized</a> |
                        <a href="#" onclick="deleteImage('${fileName}')">Delete</a>
                    </div>`;
                container.append(html);
            });
        } catch (err) {
            console.error("List error:", err);
            alert("Failed to load image list.");
        }
    });

    async function logEvent(imageKey, eventType) {
        try {
            await fetch("https://<YOUR-API-GW-URL>/log-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageKey, eventType })
            });
        } catch (err) {
            console.warn("Logging event failed:", err);
        }
    }
    

    window.deleteImage = async function (fileName) {
        const fullKey = `uploads/${fileName}`; // Reconstruct the correct S3 object key
    
        if (!confirm(`Delete image: ${fileName}?`)) return;
    
        try {
            const url = new URL(defaultUrls.delete);
            url.searchParams.set("fileName", fullKey); // send full path
    
            const res = await fetch(url, { method: "DELETE" });
            const result = await res.json();
    
            if (!res.ok) throw new Error(result.error || "Delete failed");
    
            alert(result.message || "Image deleted");
            $("#loadImageListButton").click();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete image.");
        }
    };
    

    $("#configForm").submit(function (e) {
        e.preventDefault();
        const action = e.originalEvent.submitter.name;

        if (action === "save") {
            localStorage.setItem("functionUrlPresign", $("#functionUrlPresign").val());
            localStorage.setItem("functionUrlList", $("#functionUrlList").val());
            localStorage.setItem("functionUrlDelete", $("#functionUrlDelete").val());
            localStorage.setItem("functionUrlResize", $("#functionUrlResize").val());
            alert("Config saved.");
        } else if (action === "clear") {
            localStorage.clear();
            $("#functionUrlPresign, #functionUrlList, #functionUrlDelete, #functionUrlResize, #presignUrlDisplay").val("");
            alert("Config cleared.");
        }
    });
})(jQuery);
