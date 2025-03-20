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

    let imageItemTemplate = Handlebars.compile($("#image-item-template").html());

    // Generate Presigned URL & Ensure UI Updates
    $("#functionUrlPresign").click(async function () {
        let fileInput = $("#customFile")[0].files[0]; 
        if (!fileInput) {
            alert("Please select a file first.");
            return;
        }

        let fileName = encodeURIComponent(fileInput.name);

        try {
            console.log("🔹 Calling API Gateway for Presigned URL:", `${defaultUrls.presign}?fileName=${fileName}`);

            const response = await $.ajax({
                url: `${defaultUrls.presign}?fileName=${fileName}`,
                method: "GET",
            });

            console.log("Presigned URL Response:", response);

            if (!response.url) {
                console.error("❌ No presigned URL received.");
                alert("Error: No presigned URL received.");
                return;
            }

            // Ensure UI updates correctly
            $("#functionUrlPresign").val(response.url);
            console.log("Updated input field with URL:", response.url);

            // Copy to clipboard for easy testing
            navigator.clipboard.writeText(response.url).then(() => {
                console.log("Presigned URL copied to clipboard!");
            });

            // Save to localStorage for persistence
            localStorage.setItem("functionUrlPresign", response.url);

        } catch (error) {
            console.error("❌ Error generating presign URL:", error);
            alert("Failed to generate presign URL.");
        }
    });

    // Handle Load, Save, Clear Actions in Config Form
    $("#configForm").submit(async function (event) {
        event.preventDefault();
        let action = event.originalEvent.submitter.getAttribute('name');

        if (action === "load") {
            try {
                alert("This feature is not used with API Gateway URLs. Skipping Load.");
            } catch (error) {
                console.error("Error loading function URLs", error);
                alert("Error loading function URLs. Check the logs.");
            }
        } else if (action === "save") {
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

        let file = $("#customFile")[0].files[0];
        if (!file) {
            alert("Please select a file to upload.");
            $("#uploadForm button").removeClass('disabled');
            return;
        }

        let presignedUrl = $("#functionUrlPresign").val();
        if (!presignedUrl) {
            alert("Please generate a presigned URL first.");
            $("#uploadForm button").removeClass('disabled');
            return;
        }

        try {
            console.log("🔹 Uploading to Presigned URL:", presignedUrl);

            let response = await fetch(presignedUrl, {
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

})(jQuery);
