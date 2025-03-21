(function ($) {
    // Default API Gateway URLs
    const apiGatewayBaseUrl = "https://h1144tmyfe.execute-api.us-east-1.amazonaws.com/prod";
    const defaultUrls = {
        presign: `${apiGatewayBaseUrl}/presign`,
        list: `${apiGatewayBaseUrl}/list`,
        delete: `${apiGatewayBaseUrl}/delete`,
        resize: `${apiGatewayBaseUrl}/resize`
    };

    // Initialize UI fields
    $("#functionUrlPresign").val("");
    $("#functionUrlList").val("");
    $("#functionUrlDelete").val("");
    $("#functionUrlResize").val("");

    const imageItemTemplate = Handlebars.compile($("#image-item-template").html());

    // Generate Presigned URL
    $("#functionUrlPresign").click(async function () {
        const fileInput = $("#customFile")[0].files[0];
        if (!fileInput) {
            alert("Please select a file first.");
            return;
        }

        const fileName = encodeURIComponent(fileInput.name);

        try {
            const response = await $.ajax({
                url: `${defaultUrls.presign}?fileName=${fileName}`,
                method: "GET",
                dataType: "json"
            });

            if (!response || typeof response !== "object" || !response.url) {
                console.error("Invalid response format or missing URL.", response);
                alert("Error: Invalid response format or missing URL.");
                return;
            }

            $("#functionUrlPresign").val(response.url).trigger("change");
            navigator.clipboard.writeText(response.url);
            localStorage.setItem("functionUrlPresign", response.url);
        } catch (error) {
            console.error("Error generating presign URL:", error);
            alert("Failed to generate presign URL.");
        }
    });

    // Handle Save/Clear in Config Form
    $("#configForm").submit(async function (event) {
        event.preventDefault();
        const action = event.originalEvent.submitter.getAttribute('name');

        if (action === "save") {
            localStorage.setItem("functionUrlPresign", $("#functionUrlPresign").val());
            localStorage.setItem("functionUrlList", $("#functionUrlList").val());
            localStorage.setItem("functionUrlDelete", $("#functionUrlDelete").val());
            localStorage.setItem("functionUrlResize", $("#functionUrlResize").val());
            alert("Configuration saved.");
        } else if (action === "clear") {
            localStorage.clear();
            $("#functionUrlPresign, #functionUrlList, #functionUrlDelete, #functionUrlResize").val("");
            alert("Configuration cleared.");
        } else {
            alert("Unknown action.");
        }
    });

    // Upload Image Using Presigned URL
    $("#uploadForm").submit(async function (event) {
        event.preventDefault();
        $("#uploadForm button").addClass('disabled');

        const file = $("#customFile")[0].files[0];
        if (!file) {
            alert("Please select a file to upload.");
            $("#uploadForm button").removeClass('disabled');
            return;
        }

        const presignedUrl = $("#functionUrlPresign").val();
        if (!presignedUrl) {
            alert("Please generate a presigned URL first.");
            $("#uploadForm button").removeClass('disabled');
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

            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }

            alert("Upload successful!");
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading file.");
        } finally {
            $("#uploadForm button").removeClass('disabled');
        }
    });

    // Refresh Image List
    $("#updateImageListButton").click(async function () {
        const functionUrlList = $("#functionUrlList").val();
        if (!functionUrlList) {
            alert("Please enter the list Lambda URL.");
            return;
        }

        try {
            const response = await fetch(functionUrlList);
            const images = await response.json();

            const container = $("#imagesContainer");
            container.empty();

            if (!Array.isArray(images) || images.length === 0) {
                container.append("<p>No images found.</p>");
                return;
            }

            images.forEach(image => {
                const context = {
                    Name: image.Name,
                    Timestamp: new Date().toLocaleString(),
                    Original: {
                        URL: image.URL,
                        Size: "Unknown"
                    },
                    Resized: {
                        URL: image.URL.replace("original", "resized"), // adjust logic if needed
                        Size: "Unknown"
                    }
                };
                container.append(imageItemTemplate(context));
            });
        } catch (error) {
            console.error("Error loading image list:", error);
            alert("Could not load image list.");
        }
    });

    // Delete Image
    window.deleteImage = async function (fileName) {
        const functionUrlDelete = $("#functionUrlDelete").val();
        if (!functionUrlDelete) {
            alert("Please enter the delete Lambda URL.");
            return;
        }

        if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
            return;
        }

        try {
            const url = new URL(functionUrlDelete);
            url.searchParams.append("fileName", fileName);

            const response = await fetch(url, { method: "DELETE" });
            const result = await response.json();

            if (response.ok) {
                alert(result.message || "Image deleted");
                $("#updateImageListButton").click();
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            alert("Failed to delete image.");
        }
    };

})(jQuery);
