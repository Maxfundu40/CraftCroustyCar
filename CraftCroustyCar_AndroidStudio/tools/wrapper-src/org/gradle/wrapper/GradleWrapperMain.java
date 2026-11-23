package org.gradle.wrapper;

import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.*;

/**
 * Small, auditable bootstrapper that executes Gradle from its official distribution.
 * NOT the official Gradle wrapper implementation. See README.md.
 */
public final class GradleWrapperMain {
    private GradleWrapperMain() {}

    public static void main(String[] args) throws Exception {
        File project = new File(System.getProperty("user.dir"));
        Properties props = new Properties();
        try (InputStream in = new FileInputStream(new File(project, "gradle/wrapper/gradle-wrapper.properties"))) {
            props.load(in);
        }
        String url = props.getProperty("distributionUrl");
        if (!url.equals("https://services.gradle.org/distributions/gradle-8.9-bin.zip")) {
            throw new SecurityException("Unexpected Gradle distribution URL: " + url);
        }
        Path root = Paths.get(System.getProperty("user.home"), ".gradle", "wrapper", "dists", "craftcrousty-8.9");
        Path home = root.resolve("gradle-8.9");
        boolean windows = System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("win");
        Path runner = home.resolve("bin").resolve(windows ? "gradle.bat" : "gradle");
        if (!Files.isRegularFile(runner)) {
            Files.createDirectories(root);
            Path archive = root.resolve("gradle-8.9-bin.zip");
            System.out.println("Downloading Gradle 8.9 from " + url);
            URLConnection connection = new URL(url).openConnection();
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(40000);
            try (InputStream stream = connection.getInputStream()) {
                Files.copy(stream, archive, StandardCopyOption.REPLACE_EXISTING);
            }
            try (ZipInputStream input = new ZipInputStream(Files.newInputStream(archive))) {
                ZipEntry entry;
                while ((entry = input.getNextEntry()) != null) {
                    Path target = root.resolve(entry.getName()).normalize();
                    if (!target.startsWith(root)) throw new SecurityException("Archive path traversal blocked");
                    if (entry.isDirectory()) Files.createDirectories(target);
                    else {
                        Files.createDirectories(target.getParent());
                        Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
                    }
                    input.closeEntry();
                }
            }
            Files.deleteIfExists(archive);
            if (!windows) runner.toFile().setExecutable(true);
        }
        List<String> command = new ArrayList<>();
        command.add(runner.toAbsolutePath().toString());
        Collections.addAll(command, args);
        ProcessBuilder pb = new ProcessBuilder(command).directory(project).inheritIO();
        int code = pb.start().waitFor();
        System.exit(code);
    }
}
