(function ($) {
    const apiGatewayBaseUrl = "https://muahpr7w4e.execute-api.us-east-1.amazonaws.com/prod";
    const cloudfrontBaseUrl = "https://image-resizer.fozdigitalz.com";

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
            alert("Upload successful!");
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
                const fileName = img.Name;
                const originalUrl = `${cloudfrontBaseUrl}/original/${fileName}`;
                    
                // Use the selected size to match resized key
                const selectedSize = $("#resizeOption").val() || "800x600";
                const resizedUrl = `${cloudfrontBaseUrl}/resized-${selectedSize}/${fileName}`;
                

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

    window.deleteImage = async function (fileName) {
        if (!confirm(`Delete image: ${fileName}?`)) return;

        try {
            const url = new URL(defaultUrls.delete);
            url.searchParams.set("fileName", fileName);

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
