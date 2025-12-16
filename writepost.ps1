$postType = Read-Host "Enter post type (TryHackMe or Blog): "
$postTitle = Read-Host "Enter title: "

if ($postType -eq "TryHackMe") {
    $postPath = "TryHackMe-$postTitle"
} else {
    $postPath = "blog-$postTitle"
}

hugo new "content/post/$postPath.md"
code .
hugo server -D
